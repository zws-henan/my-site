import Banner, { BannerAttributes } from "./models/Banner.js";
export interface UpdateInfo {
    id: number;
    midImg: string;
    bigImg: string;
    title: string;
    description: string;
}

// 定义 Banner 的干净返回类型（不含 deletedAt）
export type BannerDTO = Omit<BannerAttributes, 'deletedAt' | 'id'> & { id: number };

// findAll - 返回数组，不需要类型断言
export async function findAllBannerDao() {
    // TS 自动推断：Promise<Model<BannerAttributes & { deletedAt: Date | null }>[]>
    return await Banner.findAll();
}
export async function updateBannerDao(arr: UpdateInfo[]) {
    await Banner.destroy({
        truncate:true // 清空表
    })
    return await Banner.bulkCreate(arr);
}

export async function findBannerByIdDao(id: number) {
    return await Banner.findByPk(id);
}