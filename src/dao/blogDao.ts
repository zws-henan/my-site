import Blog, { BlogAttributes, TocItem } from "./models/Blog.js";
import { Op, Transaction } from "sequelize";
import BlogType,{BlogTypeAttributes} from "./models/BlogType.js";


export interface BlogInfo {
    title: string;
    description: string;
    toc: TocItem[];
    htmlCotent: string;
    thumb: string;
    scanNumber: number;
    commentNumber: number;
    createDate: Date;
    categoryId: number;
    markdownContent:string;
}

export interface FindInfo {
    page?: number;
    limit?: number;
    keyword?: string;
    categoryId?: number;
}

export type BlogDTO = Omit<BlogAttributes, "deletedAt"> & {category?:BlogTypeAttributes};

export async function addBlogDao(data: BlogInfo, t?: Transaction) {
    return await Blog.create(data, { transaction: t });
}

export async function finBlogDao(params: { offset?: number, limit?: number, keyword?: string, categoryId?: number }) {
    const where: Record<string, any> = {};
    
    // 按分类ID筛选
    if (params.categoryId && params.categoryId != -1) {
        where.categoryId = params.categoryId;
    }
    
    // 按关键词搜索
    if (params.keyword) {
        where.title = {
            [Op.like]: `%${params.keyword}%`
        };
    }
    
    const blogs = await Blog.findAndCountAll({
        include: [{
            model: BlogType,
            as: 'category',
        }],
        offset: params.offset,
        limit: params.limit,
        where,
        order: [['createDate', 'DESC']]
    });
    
    return blogs;
}

export async function findBlogByIdDao(id: number) {
    return await Blog.findByPk(id, {
        include: [{
            model: BlogType,
            as: 'category',
        }],
    });
}



export async function increaseScanNumberDao(params: { id: number }) {
    return await Blog.update({ scanNumber: Blog.sequelize.literal('scanNumber + 1') }, { where: { id: params.id } });
}
export async function increaseCommentNumberDao(params: { id: number }, t?: Transaction) {
    return await Blog.update({ commentNumber: Blog.sequelize.literal('commentNumber + 1') }, { where: { id: params.id }, transaction: t });
}
export async function decreaseCommentNumberDao(params: { id: number }, t?: Transaction) {
    return await Blog.update({ commentNumber: Blog.sequelize.literal('commentNumber - 1') }, { where: { id: params.id }, transaction: t });
}
export async function updateBlogDao(id: number,params: BlogInfo) {
    return await Blog.update(params, { where: { id } });
}

export async function delBlogDao(id: number, t?: Transaction) {
    return await Blog.destroy({ where: { id }, transaction: t });
}
