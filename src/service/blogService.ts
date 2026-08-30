import { Request } from 'express';
import { addBlogDao, finBlogDao, findBlogByIdDao, updateBlogDao, delBlogDao, increaseScanNumberDao, BlogInfo, FindInfo, BlogDTO } from "../dao/blogDao.js";
import { increaseArticleCountDao, descreaseArticleCountDao } from "../dao/blogTypeDao.js";
import { ValidateError } from '../utils/error.js';
import { handleTOC } from '../utils/tool.js';
import sequelize from '../dao/dbConnect.js';

export async function addBlogService(data: BlogInfo) {
    data = handleTOC(data);
    const result = await sequelize.transaction(async (t) => {
        const blog = await addBlogDao(data, t);
        if (blog && blog.dataValues) {
            await increaseArticleCountDao(data.categoryId, t);
            return blog;
        } else {
            throw new ValidateError('博客创建失败');
        }
    });
    return result.get({ plain: true });
}

export async function finBlogService(params: FindInfo) {

    const { page, limit, keyword, categoryId } = params;
    const offset = (page - 1) * limit;
    const result = await finBlogDao({ offset, limit, keyword, categoryId });
    let count = result.count;
    let arr = result.rows.map(item => item.get({ plain: true }));
    let newArr: BlogDTO[] = arr.map(item => {
        const { deletedAt, ...cleanItem } = item;
        delete cleanItem.category.deletedAt
        delete cleanItem.category.articleCount
        delete cleanItem.category.order
        return cleanItem;
    })
    return {
        total: count,
        rows: newArr
    }
}

export async function findBlogByIdService(id: number, headers: Request['headers']) {
    const result = await findBlogByIdDao(id);

    // 防御性：Zod 层已校验存在，但并发下可能被其他请求删除
    if (!result) {
        throw new ValidateError('博客已被删除，请刷新后重试');
    }

    if(!headers['authorization']){
        try{
            await increaseScanNumberDao({ id });
            result.dataValues.scanNumber++;
        }catch(err){
            throw new ValidateError('增加浏览量失败');
        }
    }
    return result.get({ plain: true });
}

export async function updateBlogService(id: number,params: BlogInfo) {
    params = handleTOC(params);
    await updateBlogDao(id, params);
    const data = await findBlogByIdDao(id);

    // 防御性：并发删除保护
    if (!data) {
        throw new ValidateError('博客已被删除，请刷新后重试');
    }
    return data.get({ plain: true });
}

export async function delBlogService(id: number) {
    const data = await findBlogByIdDao(id);

    // 防御性：并发删除保护
    if (!data) {
        throw new ValidateError('博客已被删除，请刷新后重试');
    }

    const result = await sequelize.transaction(async (t) => {
        const deleted = await delBlogDao(id, t);
        if (deleted) {
            const categoryId = data.dataValues.categoryId;
            await descreaseArticleCountDao(categoryId, t);
            return true;
        } else {
            throw new ValidateError('删除博客失败');
        }
    });
    return result;
}
