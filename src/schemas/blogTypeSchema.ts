import { z } from 'zod';
import { findBlogTypeByIdDao } from '../dao/blogTypeDao.js';

// BlogType 存在性异步校验
async function validateBlogTypeExists(id: number): Promise<boolean> {
    const blogType = await findBlogTypeByIdDao(id);
    return blogType !== null;
}

// 通用：将字符串转为非负整数
const stringToNonNegativeInt = (val: string) => {
    const num = Number(val);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        return false;
    }
    return true;
};

// 通用：将字符串转为任意整数（含负数）
const stringToInt = (val: string) => {
    const num = Number(val);
    if (isNaN(num) || !Number.isInteger(num)) {
        return false;
    }
    return true;
};

// BlogType 创建 schema
export const CreateBlogTypeSchema = z.object({
    name: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '分类名称不能为空';
            }
            return '分类名称必须是字符串';
        }
    }).min(1, '分类名称不能为空').max(50, '分类名称最多50个字符'),

    articleCount: z.any().transform(() => 0),

    order: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '排序值不能为空';
            }
            return '排序值必须是数字字符串';
        }
    }).refine(stringToInt, '排序值必须是整数').transform(Number)
});

// BlogType 更新 schema（所有字段可选）
export const UpdateBlogTypeSchema = z.object({
    name: z.string().min(1, '分类名称不能为空').max(50, '分类名称最多50个字符').optional(),
    articleCount: z.string()
        .refine(stringToNonNegativeInt, '文章数量必须是非负整数')
        .transform(Number)
        .optional(),
    order: z.string()
        .refine(stringToInt, '排序值必须是整数')
        .transform(Number)
        .optional()
});

// BlogType ID 参数 schema
export const BlogTypeIdSchema = z.object({
    id: z.string()
        .transform(Number)
        .refine(val => !isNaN(val), {
            message: 'ID必须是有效的数字'
        })
        .refine(validateBlogTypeExists, {
            message: '分类不存在，请输入有效的分类ID'
        })
});

// 从 schema 推导出的 TypeScript 类型
export type CreateBlogTypeDto = z.infer<typeof CreateBlogTypeSchema>;
export type UpdateBlogTypeDto = z.infer<typeof UpdateBlogTypeSchema>;
export type BlogTypeIdParams = z.infer<typeof BlogTypeIdSchema>;
