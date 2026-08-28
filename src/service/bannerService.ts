import { findAllBannerDao, BannerDTO, UpdateInfo,updateBannerDao } from "../dao/bannerDao.js";

export async function findBanners(): Promise<BannerDTO[]> {
    const banners = await findAllBannerDao();
    
    // 从 Model 实例中提取 dataValues，排除 deletedAt
    return banners.map(item => {
        const data = item.get({ plain: true }) as { id: number; midImg: string; bigImg: string; title: string; description: string; deletedAt: Date | null };
        const { deletedAt, ...cleanData } = data;
        return cleanData;
    });
}

export async function updateBanner(arr: UpdateInfo[]) {
    if(arr.length !== 3){
        throw new Error('banner数量必须为3个');
    }
    const result = await updateBannerDao(arr);
    return result;
}