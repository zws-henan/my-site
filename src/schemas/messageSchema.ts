import { z } from 'zod';
import { findMessageByIdDao } from '../dao/messageDao.js';
import { findBlogByIdDao } from '../dao/blogDao.js';

// ============================================================================
// Zod v4 统一错误（禁止 required_error / invalid_type_error）
// ============================================================================
const requiredOrInvalid = (fieldName: string) => (issue: any) => {
    if (issue.input === undefined || issue.input === null) {
        return `${fieldName}不能为空`;
    }
    return `${fieldName}格式不正确`;
};

// ---------- 路径/头像 URL 校验（允许 /static/... 相对路径 或 http(s):// 绝对 URL） ----------
function isValidAssetPath(val: string): boolean {
    if (!val) return false;
    if (val.startsWith('/')) return true;
    return /^https?:\/\//.test(val);
}

// ---------- Message 存在性异步校验 ----------
async function validateMessageExists(id: number): Promise<boolean> {
    const message = await findMessageByIdDao(id);
    return message !== null;
}

// ---------- Blog 存在性异步校验（只有 blogId 是有实际值时才查 DB） ----------
async function validateBlogExistsIfAny(blogId: number | null | undefined): Promise<boolean> {
    if (blogId === undefined || blogId === null) return true;
    const blog = await findBlogByIdDao(blogId);
    return blog !== null;
}

// ============================================================================
// 公共字段 Schema
// ============================================================================

const nicknameSchema = z.string({ error: requiredOrInvalid('昵称') })
    .min(1, '昵称不能为空')
    .max(32, '昵称最多32个字符');

const contentSchema = z.string({ error: requiredOrInvalid('留言内容') })
    .min(1, '留言内容不能为空')
    .max(1000, '留言内容最多1000个字符');

// createDate：既允许 ISO 字符串，也允许时间戳(number/数字字符串)，最终保留字符串形态
// 与 Model 中 DataTypes.STRING 对齐；创建/修改阶段不传则后端自己补默认值，所以 optional
const createDateSchema = z.union([z.string(), z.number()], {
    error: (issue: any) => {
        if (issue.input === undefined || issue.input === null) return '创建时间不能为空';
        return '创建时间必须是日期字符串或时间戳';
    }
}).transform((val: string | number) => {
    if (typeof val === 'number') return String(val);
    return val;
}).refine((val: string) => {
    if (!val) return false;
    if (/^-?\d+$/.test(val)) {
        const n = Number(val);
        return !isNaN(new Date(n).getTime());
    }
    return !isNaN(new Date(val).getTime());
}, { message: '创建时间格式不正确' });

// 头像：必须是 /xxx 相对路径或 http(s):// URL
// 创建/修改阶段不传则后端自己补默认头像，所以 optional
const avatarSchema = z.string({ error: requiredOrInvalid('头像') })
    .min(1, '头像不能为空')
    .max(255, '头像路径最多255个字符')
    .refine(isValidAssetPath, { message: '头像必须是合法路径(/开头)或网络地址(http(s)://)' });

// ============================================================================
// blogId 三份 Schema：按场景强度分（核心改动：不再相互复用，.optional() 只在顶层加一次）
// ============================================================================

// ---------- 1️⃣ 宽松版：Query 列表查询用 --------------------
//  规则（三种互斥语义，完全匹配你的要求）：
//   - 不传 / 传 null / 传 undefined / 传空串 ""   → null  （SQL: blogId IS NULL → 只查【全局留言板】）
//   - 传 -1 / 传 "-1" 字符串                       → -1    （SQL: blogId IS NOT NULL → 只查【关联了博客】的评论，即有归属博客的留言）
//   - 传合法正整数（数字 / 纯数字字符串）          → 该数字（SQL: blogId = N → 只查【具体某篇博客】下的留言）
//   - 传非数字（"abc"）/ 小于-1 的负数 / 0 / 小数 → 报错"博客ID必须为-1(全部已关联)、null(全局)或正整数(某博客)"
//  不做 Blog 存在性检查：读列表不用"保证有这个博客"，没博客也只是返回空行
//
//  注意：不用 .default(null) + union 组合，因为 Zod 在 union+default 时对 "缺省的 undefined"
//        生效顺序不可靠；改成直接"任何 undefined/null/'' → null"的显式 transform 更稳健。
const blogIdSchemaForQuery = z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
        // 1) "不传 / 空串 / null" → null（全局留言板）
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') {
            // 2) 数字：-1(标记「所有关联博客的评论」)，或 ≥1 的正整数 → 直接返回；其余所有（0/小数/-2…）→ -2 触发 refine 报错
            if (val === -1 || (Number.isInteger(val) && val >= 1)) return val;
            return -2;
        }
        // 3) 字符串：先尝试匹配纯整数（允许正整数 和 "-1"）
        if (typeof val === 'string') {
            if (val === '-1') return -1;      // 🆕 字符串 "-1" → 标记值 -1
            if (/^\d+$/.test(val)) {          // 字符串 "9" → 正整数
                const n = Number(val);
                if (n >= 1) return n;
            }
        }
        return -2; // 其他一切格式（"abc"/"1.5"/"-5"/"0"/"-01" 等）→ -2 触发 refine 报错
    })
    .refine((val) => val === null || val === -1 || val >= 1, {
        message: '博客ID必须为 -1(查所有关联博客)、不传/null(查全局) 或 正整数(查某博客)',
    }) as z.ZodType<number | null>;   // 推断出来的类型：null / -1 / 正整数

// ---------- 2️⃣ 中强版：Create 创建用 --------------------
//  - 不传 / null / undefined / 空串 → null（全局留言）
//  - 合法正整数 → 数字，并且查 DB 确认对应博客存在（外键语义）
//  不在 schema 内部加 .optional()：交给 CreateMessageSchema 顶层决定（目前就是必传的字段，但 null 能通过）
const blogIdSchemaForCreate = z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val): number | null => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') {
            return Number.isInteger(val) && val >= 1 ? val : NaN;
        }
        if (/^\d+$/.test(val)) {
            const n = Number(val);
            return n >= 1 ? n : NaN;
        }
        return NaN;
    })
    .refine((val) => val === null || (!isNaN(val) && val >= 1), {
        message: '博客ID必须是有效的正整数',
    })
    .refine(validateBlogExistsIfAny, {
        message: '博客不存在，请输入有效的博客ID',
    })
    .nullish();   // 允许 null / undefined 直接通过 → 统一落到 transform 里处理成 null

// ---------- 3️⃣ 同强度：Update 修改用 --------------------
//  - 不传 → undefined（不修改 blogId 列）
//  - 传 null/空串 → null（改回全局留言）
//  - 传正整数 → 校验存在后写入
//  整体 .nullish().optional()：顶层决定"可空 + 可省略"
const blogIdSchemaForUpdate = z.union([z.string(), z.number()])
    .transform((val): number | null => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') {
            return Number.isInteger(val) && val >= 1 ? val : NaN;
        }
        if (/^\d+$/.test(val)) {
            const n = Number(val);
            return n >= 1 ? n : NaN;
        }
        return NaN;
    })
    .refine((val) => val === null || (!isNaN(val) && val >= 1), {
        message: '博客ID必须是有效的正整数',
    })
    .refine(validateBlogExistsIfAny, {
        message: '博客不存在，请输入有效的博客ID',
    })
    .nullish()
    .optional();

// ============================================================================
// 4 类入口 Schema
// ============================================================================

// ---------- 1. 路径参数 ID（params/:id）----------
export const MessageIdSchema = z.object({
    id: z.string({ error: requiredOrInvalid('ID') })
        .min(1, 'ID不能为空')
        .transform((val: string) => Number(val))
        .refine((val: number) => !isNaN(val) && Number.isInteger(val), { message: 'ID必须是有效的整数' })
        .refine(validateMessageExists, { message: '留言不存在，请输入有效的ID' }),
});
export type MessageIdParams = z.infer<typeof MessageIdSchema>;

// ---------- 2. 查询参数（列表分页 GET /message?page=&limit=&keyword=&blogId=）----------
// 顺序：z.string → min → transform → refine → optional → default
export const MessageQuerySchema = z.object({
    page: z.string()
        .min(1, '页码不能为空')
        .transform((val: string) => Number(val))
        .refine((val: number) => !isNaN(val) && Number.isInteger(val) && val >= 1, { message: '页码必须是大于0的整数' })
        .optional()
        .default(1),
    limit: z.string()
        .min(1, '每页数量不能为空')
        .transform((val: string) => Number(val))
        .refine((val: number) => !isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 100, { message: '每页数量必须是1~100之间的整数' })
        .optional()
        .default(10),
    keyword: z.string()
        .min(1, '搜索关键词不能为空')
        .optional(),
    blogId: blogIdSchemaForQuery.optional(),   // ✅ 宽松版：不传/空串 → null → 查全局留言（符合你的要求）
})
    // 🛡 防御性兜底：前端/Apifox 经常手滑把 blogId 写成全小写 blogid（Vue 代码里之前也写错了），
    //   导致 blogId 这个键根本不存在，后端就当不传→全局。这里做一次"键名兼容"：
    //   如果对象里有 blogid（全小写）且没有 blogId（驼峰）→ 自动拷到 blogId 上，再走后面的 parse
    .transform((raw: Record<string, any>) => {
        if ((raw.blogid !== undefined) && (raw.blogId === undefined)) {
            raw.blogId = raw.blogid;
            delete raw.blogid;    // 顺手删掉不规范的键，避免后面类型判断时有杂音
        }
        return raw;
    });
export type MessageQueryParams = z.infer<typeof MessageQuerySchema>;

// ---------- 3. 创建 DTO（avatar/createDate/blogId 不传后端也能处理） ----------
export const CreateMessageSchema = z.object({
    nickname: nicknameSchema,
    content: contentSchema,
    createDate: createDateSchema.optional(),
    avatar: avatarSchema.optional(),
    blogId: blogIdSchemaForCreate,   // ✅ 中强版：允许 null(全局) / 正整数(关联博客 + 存在性检查)
});
export type CreateMessageDto = z.infer<typeof CreateMessageSchema>;

// ---------- 4. 修改 DTO（所有字段都可传可不传） ----------
export const UpdateMessageSchema = z.object({
    nickname: nicknameSchema.optional(),
    content: contentSchema.optional(),
    createDate: createDateSchema.optional(),
    avatar: avatarSchema.optional(),
    blogId: blogIdSchemaForUpdate,   // ✅ 同强版：不传 → 不修改；传 null → 改回全局留言
});
export type UpdateMessageDto = z.infer<typeof UpdateMessageSchema>;
