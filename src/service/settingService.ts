import {
    getSetting,
    updateSetting,
    SettingDTO,
    UpdateInfo as SettingUpdateInfo,
} from '../dao/settingDao.js';

// ---------- 查：获取全局站点配置 ----------
// Setting 是单行表，永远只返回 id=1 那一条；不存在自动用模型默认值 INSERT 后返回
export async function getSettingService(): Promise<SettingDTO> {
    const setting = await getSetting();
    return setting;
}

// ---------- 改：保存全局站点配置 ----------
// 直接传要改的字段子集（avatar/siteTitle/...），内部固定更新 id=1，不用传 id
// 返回保存后的完整最新配置（前端可以直接回填表单）
export async function updateSettingService(update: SettingUpdateInfo): Promise<SettingDTO> {
    return await updateSetting(update);
}

export type { SettingDTO as SettingInfo, SettingUpdateInfo };
