import { z } from 'zod';

/* =========================================================
 *  Setting 数据验证（站点全局配置单例表）
 *  Schema 设计对齐项目统一风格：
 *   - Zod v4 统一 z.string({ error: issue => 中文描述 })
 *   - 所有 URL/路径校验统一用 isValidUrlOrRelative
 *   - 路由 Id 强校验「只能是 1」（因为 Setting 永远只有 id=1 的一行全局配置）
 * ========================================================= */

// 共用：图片/文件路径校验：允许「/ 开头的站内相对路径」或「http(s):// 完整 URL」
const isValidUrlOrRelative = (val: string) =>
    val === '' || val.startsWith('/') || /^https?:\/\//.test(val);

// ---- 11 个配置项各自的 Zod 基础定义（给 Create/Update 复用，避免写 11 遍）----
// 头像路径
const avatarSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '站长头像不能为空';
        return '站长头像必须是字符串路径或URL';
    },
}).refine(isValidUrlOrRelative, '站长头像必须是以 / 开头的路径或 http(s):// URL');

// 站点标题
const siteTitleSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '站点标题不能为空';
        return '站点标题必须是字符串';
    },
}).min(1, '站点标题至少1个字符').max(80, '站点标题最多80个字符');

// GitHub 主页链接
const githubSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return 'GitHub链接不能为空';
        return 'GitHub链接必须是字符串';
    },
}).refine(isValidUrlOrRelative, 'GitHub链接必须是以 / 开头或 http(s):// URL');

// QQ 号
const qqSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return 'QQ号不能为空';
        return 'QQ号必须是字符串';
    },
}).max(20, 'QQ号最多20个字符');

// QQ 二维码图片路径
const qqQrCodeSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return 'QQ二维码不能为空';
        return 'QQ二维码必须是字符串路径或URL';
    },
}).refine(isValidUrlOrRelative, 'QQ二维码必须是以 / 开头的路径或 http(s):// URL');

// 微信号
const weixinSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '微信号不能为空';
        return '微信号必须是字符串';
    },
}).max(50, '微信号最多50个字符');

// 微信二维码图片路径
const weixinQrCodeSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '微信二维码不能为空';
        return '微信二维码必须是字符串路径或URL';
    },
}).refine(isValidUrlOrRelative, '微信二维码必须是以 / 开头的路径或 http(s):// URL');

// 联系邮箱
const mailSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '联系邮箱不能为空';
        return '联系邮箱必须是字符串';
    },
}).email('联系邮箱格式不正确').or(z.literal(''));

// 备案号
const icpSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return '备案号不能为空';
        return '备案号必须是字符串';
    },
}).max(100, '备案号最多100个字符');

// GitHub 昵称
const githubNameSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return 'GitHub昵称不能为空';
        return 'GitHub昵称必须是字符串';
    },
}).max(50, 'GitHub昵称最多50个字符');

// favicon 路径
const faviconSchema = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) return 'favicon不能为空';
        return 'favicon必须是字符串路径或URL';
    },
}).refine(isValidUrlOrRelative, 'favicon必须是以 / 开头的路径或 http(s):// URL');

// ---------- 1. 创建 DTO（单行配置表几乎不用 CREATE 接口，但保留 5 接口风格统一）----------
export const CreateSettingSchema = z.object({
    avatar: avatarSchema,
    siteTitle: siteTitleSchema,
    github: githubSchema,
    qq: qqSchema,
    qqQrCode: qqQrCodeSchema,
    weixin: weixinSchema,
    weixinQrCode: weixinQrCodeSchema,
    mail: mailSchema,
    icp: icpSchema,
    githubName: githubNameSchema,
    favicon: faviconSchema,
});
export type CreateSettingDto = z.infer<typeof CreateSettingSchema>;

// ---------- 2. 修改 DTO（所有列可选：管理员后台每次只想改 1~2 列）----------
export const UpdateSettingSchema = z.object({
    avatar: avatarSchema.optional(),
    siteTitle: siteTitleSchema.optional(),
    github: githubSchema.optional(),
    qq: qqSchema.optional(),
    qqQrCode: qqQrCodeSchema.optional(),
    weixin: weixinSchema.optional(),
    weixinQrCode: weixinQrCodeSchema.optional(),
    mail: mailSchema.optional(),
    icp: icpSchema.optional(),
    githubName: githubNameSchema.optional(),
    favicon: faviconSchema.optional(),
});
export type UpdateSettingDto = z.infer<typeof UpdateSettingSchema>;

// ---------- 3. ID 参数（Setting 永远只有 1 行 id=1 → 直接锁死只能是 1，避免前端传 2 查到空报错）----------
export const SettingIdSchema = z.object({
    id: z.string()
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && Number.isInteger(val), { message: 'ID必须是有效的整数' })
        .refine((val) => val === 1, {
            message: '全局配置只有 id=1 这一条记录，不允许访问其他 id',
        }),
});
export type SettingIdParams = z.infer<typeof SettingIdSchema>;

// ---------- 4. 查询参数（列表 GET /api/setting；虽然单行表不需要分页，但为了和其他模块统一保留 page/limit/keyword）----------
export const SettingQuerySchema = z.object({
    page: z.string()
        .transform(Number)
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 1, { message: '页码必须是≥1的整数' })
        .optional()
        .default(1),
    limit: z.string()
        .transform(Number)
        .refine((val) => !isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 100, { message: '每页数量必须在1~100之间' })
        .optional()
        .default(10),
    keyword: z.string().min(1, '关键词至少1个字符').optional(),
});
export type SettingQueryParams = z.infer<typeof SettingQuerySchema>;
