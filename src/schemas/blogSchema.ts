import { z } from 'zod';
import BlogType from '../dao/models/BlogType.js';
import type { TocItem } from '../dao/models/Blog.js';
import { findBlogByIdDao } from '../dao/blogDao.js';

// 图片路径验证：支持相对路径（/static/...）和完整URL（http://...）
const isValidImagePath = (val: string) =>
    val.startsWith('/') || /^https?:\/\//.test(val);

const imagePathMessage = (fieldName: string) =>
    `${fieldName}必须是以 / 开头的路径或 http(s):// 开头的URL`;

// 验证 categoryId 是否存在于 BlogType 表中
const validateCategoryId = async (categoryId: number) => {
    const category = await BlogType.findByPk(categoryId);
    return category !== null;
};

// 验证 Blog ID 是否存在于 Blog 表中
const validateBlogExists = async (id: number) => {
    const blog = await findBlogByIdDao(id);
    return blog !== null;
};

// 日期验证：支持字符串和数字时间戳
const dateSchema = z.union([
    z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '创建日期不能为空';
            }
            return '创建日期必须是有效的日期字符串';
        }
    }),
    z.number({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '创建日期不能为空';
            }
            return '创建日期必须是有效的时间戳';
        }
    })
]).transform(val => {
    // 如果是数字时间戳，直接转换
    if (typeof val === 'number') {
        return new Date(val);
    }
    // 如果是字符串，先尝试用 Number() 转换（如果是数字字符串）
    if (/^\d+$/.test(val)) {
        return new Date(Number(val));
    }
    // 否则直接用 new Date() 解析字符串
    return new Date(val);
}).refine(
    val => !isNaN(val.getTime()),
    '创建日期格式无效，应为有效的日期字符串或时间戳'
);

// TOC 项 schema（支持递归 children）
const TocItemSchema: z.ZodType<TocItem> = z.object({
    name: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '章节名称不能为空';
            }
            return '章节名称必须是字符串';
        }
    }).min(1, '章节名称不能为空').max(100, '章节名称最多100个字符'),

    anchor: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '章节锚点不能为空';
            }
            return '章节锚点必须是字符串';
        }
    }).min(1, '章节锚点不能为空').max(100, '章节锚点最多100个字符'),

    children: z.lazy(() => z.array(TocItemSchema).optional())
});

// TOC 验证：接受任意输入，非数组转为空数组，数组则验证每个元素
const tocSchema = z.any().transform(val => {
    if (Array.isArray(val)) {
        return val;
    }
    return [];
}).pipe(z.array(TocItemSchema));

// Blog 创建 schema
export const CreateBlogSchema = z.object({
    categoryId: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '分类ID不能为空';
            }
            return '分类ID必须是数字字符串';
        }
    }).transform(Number).refine(
        val => !isNaN(val),
        '分类ID必须是有效的数字'
    ).refine(
        validateCategoryId,
        '分类不存在，请输入有效的分类ID'
    ),

    title: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '博客标题不能为空';
            }
            return '博客标题必须是字符串';
        }
    }).min(1, '博客标题不能为空').max(100, '博客标题最多100个字符'),

    description: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '博客描述不能为空';
            }
            return '博客描述必须是字符串';
        }
    }).min(10, '博客描述至少10个字符').max(500, '博客描述最多500个字符'),

    toc: tocSchema,

    htmlCotent: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '博客内容不能为空';
            }
            return '博客内容必须是字符串';
        }
    }),

    thumb: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '缩略图不能为空';
            }
            return '缩略图必须是字符串';
        }
    }).refine(isValidImagePath, imagePathMessage('缩略图')),

    scanNumber: z.any().optional().transform(() => 0),

    commentNumber: z.any().optional().transform(() => 0),
    markdownContent: z.string().optional(),
    createDate: dateSchema
});

// Blog 更新 schema（所有字段可选）
export const UpdateBlogSchema = z.object({
    categoryId: z.string().transform(Number).refine(
        val => !isNaN(val),
        '分类ID必须是有效的数字'
    ).refine(
        validateCategoryId,
        '分类不存在，请输入有效的分类ID'
    ).optional(),

    title: z.string().min(1, '博客标题不能为空').max(100, '博客标题最多100个字符').optional(),
    description: z.string().min(10, '博客描述至少10个字符').max(500, '博客描述最多500个字符').optional(),
    toc: tocSchema.optional(),
    htmlCotent: z.string().optional(),
    thumb: z.string().refine(isValidImagePath, imagePathMessage('缩略图')).optional(),
    scanNumber: z.any().transform(Number).optional(),
    commentNumber: z.any().transform(Number).optional(),
    markdownContent: z.string().optional(),
    createDate: dateSchema.optional()
});

// Blog ID 参数 schema
export const BlogIdSchema = z.object({
    id: z.string()
        .transform(Number)
        .refine(val => !isNaN(val), {
            message: 'ID必须是有效的数字'
        })
        .refine(validateBlogExists, {
            message: '博客不存在，请输入有效的ID'
        })
});

// Blog 查询参数 schema
export const BlogQuerySchema = z.object({
    page: z.string().transform(Number).refine(val => val > 0, '页码必须大于0').optional(),
    limit: z.string().transform(Number).refine(val => val > 0, '每页数量必须大于0').optional(),
    keyword: z.string().optional(),
    categoryId: z.string().transform(Number).refine(val => !isNaN(val), '分类ID必须是有效的数字').optional()
});

// 从 schema 推导出的 TypeScript 类型
export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
export type BlogIdParams = z.infer<typeof BlogIdSchema>;
export type BlogQueryParams = z.infer<typeof BlogQuerySchema>;

// 重新导出 TocItem 类型
export type { TocItem };
