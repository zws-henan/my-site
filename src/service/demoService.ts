import { addDemoDao, DemoInfo, updateDemoDao, deleteDemoDao ,findDemoDao,findDemoByIdDao,FindInfo} from "../dao/demoDao.js";
import { ValidateError } from "../utils/error.js";


export async function addDemoService(data: DemoInfo) {
    const result = await addDemoDao(data);

    // 防御性：create 成功但数据无法读取时的兜底
    if (!result) {
        throw new ValidateError('Demo 创建失败');
    }
    return result.get({ plain: true });
}

export async function updateDemoService(id: number, data: DemoInfo) {
    await updateDemoDao(id, data);
    const demo = await findDemoByIdDao(id);

    // 防御性：并发删除保护
    if (!demo) {
        throw new ValidateError('Demo 已被删除，请刷新后重试');
    }
    return demo.get({ plain: true });
}

export async function findAllDemoService(params: FindInfo) {
    const { page, limit, keyword } = params;
    const offset = (page - 1) * limit;
    const result = await findDemoDao({offset, limit, keyword});
    let count = result.count;
    let rows = result.rows.map(item => item.get({ plain: true })).map(item => {
        const {deletedAt,...rest} = item;
        return rest;
    });
    return {
        count,
        rows,
    };
}

export async function findDemoByIdService(id: number) {
    const result = await findDemoByIdDao(id);

    // 防御性：并发删除保护
    if (!result) {
        throw new ValidateError('Demo 已被删除，请刷新后重试');
    }
    return result.get({ plain: true });
}

export async function deleteDemoService(id: number) {
    await deleteDemoDao(id);
    return true;
}
