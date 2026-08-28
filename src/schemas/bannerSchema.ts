import { z } from 'zod';
import { findBannerByIdDao } from '../dao/bannerDao.js';

// 图片路径验证：支持相对路径（/static/...）和完整URL（http://...）
const isValidImagePath = (val: string) =>
    val.startsWith('/') || /^https?:\/\//.test(val);

const imagePathMessage = (fieldName: string) =>
    `${fieldName}必须是以 / 开头的路径或 http(s):// 开头的URL`;

// Banner 存在性异步校验
async function validateBannerExists(id: number): Promise<boolean> {
    const banner = await findBannerByIdDao(id);
    return banner !== null;
}

// Banner 创建 schema
export const CreateBannerSchema = z.object({
    midImg: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '移动端图片不能为空';
            }
            return '移动端图片必须是字符串';
        }
    }).refine(isValidImagePath, imagePathMessage('移动端图片')),
    
    bigImg: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return 'PC端图片不能为空';
            }
            return 'PC端图片必须是字符串';
        }
    }).refine(isValidImagePath, imagePathMessage('PC端图片')),
    
    title: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '标题不能为空';
            }
            return '标题必须是字符串';
        }
    }).min(2, '标题至少2个字符').max(100, '标题最多100个字符'),
    
    description: z.string({
        error: (issue) => {
            if (issue.input === undefined || issue.input === null) {
                return '描述不能为空';
            }
            return '描述必须是字符串';
        }
    }).min(5, '描述至少5个字符').max(500, '描述最多500个字符')
});

// Banner 更新 schema（单条，所有字段可选）
export const UpdateBannerItemSchema = z.object({
    midImg: z.string().refine(isValidImagePath, imagePathMessage('移动端图片')).optional(),
    bigImg: z.string().refine(isValidImagePath, imagePathMessage('PC端图片')).optional(),
    title: z.string().min(2, '标题至少2个字符').max(100, '标题最多100个字符').optional(),
    description: z.string().min(5, '描述至少5个字符').max(500, '描述最多500个字符').optional()
});

// Banner 批量更新 schema（数组）
export const UpdateBannerSchema = z.array(UpdateBannerItemSchema);

// Banner ID 参数 schema
export const BannerIdSchema = z.object({
    id: z.string()
        .transform(Number)
        .refine(val => !isNaN(val), {
            message: 'ID必须是有效的数字'
        })
        .refine(validateBannerExists, {
            message: 'Banner不存在，请输入有效的ID'
        })
});

// Banner 查询参数 schema
export const BannerQuerySchema = z.object({
    page: z.string().transform(Number).refine(val => val > 0, '页码必须大于0').optional(),
    limit: z.string().transform(Number).refine(val => val > 0, '每页数量必须大于0').optional()
});

// 从 schema 推导出的 TypeScript 类型
export type CreateBannerDto = z.infer<typeof CreateBannerSchema>;
export type UpdateBannerItemDto = z.infer<typeof UpdateBannerItemSchema>;
export type UpdateBannerDto = z.infer<typeof UpdateBannerSchema>;
export type BannerIdParams = z.infer<typeof BannerIdSchema>;
export type BannerQueryParams = z.infer<typeof BannerQuerySchema>;
