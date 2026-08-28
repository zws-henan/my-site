import { addBlogTypeDao, findAllBlogTypeDao, findBlogTypeByIdDao, updateBlogTypeDao, delBlogTypeDao, BlogTypeInfo } from "../dao/blogTypeDao.js";
import { ValidateError } from "../utils/error.js";


export async function addBlogTypeService(newBlogTypeInfo: BlogTypeInfo) {
    const result = await addBlogTypeDao(newBlogTypeInfo);
    return result.get({ plain: true });
}

export async function findAllBlogTypeService() {
    let result = await findAllBlogTypeDao();
    return result.map(item => item.get({ plain: true })).sort((a, b) => a.order - b.order);
}

export async function findBlogTypeByIdService(id: number) {
    const result = await findBlogTypeByIdDao(id);

    // 防御性：并发删除保护
    if (!result) {
        throw new ValidateError('分类已被删除，请刷新后重试');
    }
    return result.get({ plain: true });
}

export async function updateBlogTypeService(id: number, updateInfo: BlogTypeInfo) {
    await updateBlogTypeDao(id, updateInfo);
    return {
        id,
        name: updateInfo.name,
        articleCount: updateInfo.articleCount,
        order: updateInfo.order,
    };
}

export async function delBlogTypeService(id: number) {
    const data = await findBlogTypeByIdDao(id);

    // 防御性：并发删除保护
    if (!data) {
        throw new ValidateError('分类已被删除，请刷新后重试');
    }

    const result = await delBlogTypeDao(id);
    void result;
    return data.dataValues.articleCount;
}
