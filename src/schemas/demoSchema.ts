import { z } from 'zod';
import { findDemoByIdDao } from '../dao/demoDao.js';

// ---------- 通用校验辅助函数 ----------

// 任意整数 → 可正可负
const stringToInt = (val: string) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num);
};

// 非负整数（用于计数、排序）
const stringToNonNegativeInt = (val: string) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
};

// 图片路径：/static/... 或 http(s)://...
const isValidImagePath = (val: string) =>
    val.startsWith('/') || /^https?:\/\//.test(val);

const imagePathMessage = (field: string) => `${field}必须是以 / 开头的路径或 http(s):// 开头的URL`;

// ---------- Demo 存在性异步校验 ----------
async function validateDemoExists(id: number): Promise<boolean> {
    const demo = await findDemoByIdDao(id);
    return demo !== null;
}

// ---------- Demo ID 参数校验 ----------
export const DemoIdSchema = z.object({
    id: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return 'ID不能为空';
            }
            return 'ID必须是字符串';
        }
    })
        .transform(Number)
        .refine(val => !isNaN(val) && Number.isInteger(val), {
            message: 'ID必须是有效的整数'
        })
        .refine(validateDemoExists, {
            message: 'Demo不存在，请输入有效的ID'
        }),
});

export type DemoIdParams = z.infer<typeof DemoIdSchema>;

// ---------- Demo 创建 schema（严格对齐 Demo 模型）----------
// 参考 Demo.ts: DemoCreationAttributes
//   name: string      (DataTypes.STRING)
//   url: string       (DataTypes.STRING)
//   github: string    (DataTypes.STRING)
//   description: string[]  (DataTypes.JSON — 字符串数组)
//   order: number     (DataTypes.INTEGER)
//   thumb: string     (DataTypes.STRING)

// URL / 路径通用校验：支持 http(s):// 或 /xxx 相对路径
const isValidUrlOrPath = (val: string) =>
    val.startsWith('/') || /^https?:\/\//.test(val);

// description：描述项（数组内单条字符串）的校验
const descriptionItem = z.string({
    error: (issue) => {
        if (issue.input === undefined || issue.input === null) {
            return '描述项不能为空';
        }
        return '描述项必须是字符串';
    }
})
    .min(1, '描述项内容不能为空')
    .max(500, '描述项最多500个字符');

export const CreateDemoSchema = z.object({
    name: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '名称不能为空';
            }
            return '名称必须是字符串';
        }
    })
        .min(1, '名称至少1个字符')
        .max(100, '名称最多100个字符'),

    url: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return 'url不能为空';
            }
            return 'url必须是字符串';
        }
    })
        .min(1, 'url至少1个字符')
        .max(500, 'url最多500个字符')
        .refine(isValidUrlOrPath, { message: 'url必须是以 / 开头的路径或 http(s):// 开头的URL' }),

    github: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return 'github不能为空';
            }
            return 'github必须是字符串';
        }
    })
        .min(1, 'github至少1个字符')
        .max(255, 'github最多255个字符'),

    description: z.array(descriptionItem, {
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '描述不能为空';
            }
            return '描述必须是一个数组';
        }
    })
        .min(1, '至少需要一条描述'),

    order: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '排序值不能为空';
            }
            return '排序值必须是字符串';
        }
    })
        .min(1, '排序值不能为空')
        .refine(stringToInt, { message: '排序值必须是整数' })
        .transform(Number)
        .refine(val => Number.isInteger(val), { message: '排序值必须是整数' }),

    thumb: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '缩略图不能为空';
            }
            return '缩略图必须是字符串';
        }
    })
        .refine(isValidImagePath, { message: imagePathMessage('缩略图') }),
});

export type CreateDemoDto = z.infer<typeof CreateDemoSchema>;

// ---------- Demo 更新 schema（所有字段可选） ----------
export const UpdateDemoSchema = z.object({
    name: z.string()
        .min(1, '名称至少1个字符')
        .max(100, '名称最多100个字符')
        .optional(),

    url: z.string()
        .min(1, 'url至少1个字符')
        .max(500, 'url最多500个字符')
        .refine(isValidUrlOrPath, { message: 'url必须是以 / 开头的路径或 http(s):// 开头的URL' })
        .optional(),

    github: z.string()
        .min(1, 'github至少1个字符')
        .max(255, 'github最多255个字符')
        .optional(),

    description: z.array(descriptionItem)
        .min(1, '至少需要一条描述')
        .optional(),

    order: z.string()
        .min(1, '排序值不能为空')
        .refine(stringToInt, { message: '排序值必须是整数' })
        .transform(Number)
        .refine(val => Number.isInteger(val), { message: '排序值必须是整数' })
        .optional(),

    thumb: z.string()
        .refine(isValidImagePath, { message: imagePathMessage('缩略图') })
        .optional(),
});

export type UpdateDemoDto = z.infer<typeof UpdateDemoSchema>;

// ---------- Demo 列表查询参数 ----------
export const DemoQuerySchema = z.object({
    page: z.string()
        .refine(stringToNonNegativeInt, { message: 'page必须是正整数' })
        .transform(Number)
        .optional()
        .default(1),

    limit: z.string()
        .refine(stringToNonNegativeInt, { message: 'limit必须是正整数' })
        .transform(Number)
        .optional()
        .default(10),

    keyword: z.string()
        .min(1, '关键词长度不能为0')
        .optional(),
});

export type DemoQueryParams = z.infer<typeof DemoQuerySchema>;
