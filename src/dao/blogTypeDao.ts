import BlogType, { BlogTypeAttributes } from "./models/BlogType.js";
import { Transaction } from "sequelize";

export interface BlogTypeInfo {
    name: string;
    articleCount: number;
    order: number;
}

export type BlogTypeDTO = Omit<BlogTypeAttributes, 'deletedAt'> & { id: number };

export async function addBlogTypeDao(blogTypeInfo: BlogTypeInfo) {
    const result = await BlogType.create(blogTypeInfo);
    return result;
}

export async function findAllBlogTypeDao() {
    const result = await BlogType.findAll();
    return result;
}

export async function findBlogTypeByIdDao(id: number) {
    const result = await BlogType.findByPk(id);
    return result;
}

export async function updateBlogTypeDao(id: number, updateInfo: BlogTypeInfo) {
    return await BlogType.update(updateInfo, { where: { id } });
}

export async function delBlogTypeDao(id: number) {
    return await BlogType.destroy({ where: { id } });
}

export async function increaseArticleCountDao(id: number, t?: Transaction) {
    return await BlogType.update({ articleCount: BlogType.sequelize.literal('articleCount + 1') }, { where: { id }, transaction: t });
}

export async function descreaseArticleCountDao(id: number, t?: Transaction) {
    return await BlogType.update({ articleCount: BlogType.sequelize.literal('articleCount - 1') }, { where: { id }, transaction: t });
}