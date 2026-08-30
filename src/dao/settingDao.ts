import Setting, { SettingAttributes } from "./models/Setting.js";

export interface UpdateInfo {
    avatar?: string;
    siteTitle?: string;
    github?: string;
    qq?: string;
    qqQrCode?: string;
    weixin?: string;
    weixinQrCode?: string;
    mail?: string;
    icp?: string;
    githubName?: string;
    favicon?: string;
}

// 对外输出类型：永远只有 id=1 的对象形态，不再带 deletedAt
export type SettingDTO = SettingAttributes;

/** 单例配置表永远只有这一行主键（beforeSave 钩子会强制锁住写入时 id=1） */
const SINGLETON_ID = 1 as const;

/* =========================================================
 * 【内存缓存】站点配置"10 天半个月才改一次"，但首页每次渲染都要读一次
 *   - TTL = 5 分钟（足够大的量削峰；管理员后台改完立即失效）
 *   - 写接口后立即 delete 缓存，下次读强制查库
 *   - 这是 Setting 表「性能提升 10~100 倍」的核心（比 SQL 优化都有效）
 * ========================================================= */
type CacheEntry = { ts: number; value: SettingDTO };
const CACHE_KEY = 'setting:singleton';
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟（管理员改设置后会立即失效，不用怕不新鲜）
const cache = new Map<string, CacheEntry>();

/**
 * 读：获取全局配置（永远只会返回 id=1 的那一条，不存在自动插默认值后返回）
 *  SQL 优化点：
 *   - 用 findByPk(1)（走主键索引，O(1)），不用 findOne() 不带 where 扫全表
 *   - 99% 请求命中进程内缓存，根本不进数据库
 *   - 找不到就 create({})（所有列都有 defaultValue，创建默认占位行）；beforeSave 钩子会强制 id=1
 */
export async function getSetting(): Promise<SettingDTO> {
    // 1) 先查缓存（正常 99% 命中）
    const now = Date.now();
    const hit = cache.get(CACHE_KEY);
    if (hit && now - hit.ts < CACHE_TTL) return hit.value;

    // 2) 缓存没命中 → 按主键查
    let instance = await Setting.findByPk(SINGLETON_ID);
    if (!instance) {
        // 3) 数据库里还没配置 → 创建默认行（11 列都有 defaultValue，create({}) 传空对象就行；beforeSave 自动 id=1）
        instance = await Setting.create({});
    }
    const value = instance.get({ plain: true }) as SettingDTO;

    // 4) 写缓存（下次读 0ms 返回）
    cache.set(CACHE_KEY, { ts: Date.now(), value });
    return value;
}

/**
 * 写：更新全局配置（不管之前有没有，总能成功写到 id=1 那一行）
 *  SQL 优化点：
 *   - 直接 UPDATE ... WHERE id=1（主键命中，1 行），不用先 SELECT 再 UPDATE
 *   - 如果影响行数=0（表还空），先 create({...update}) 再返回（beforeSave 锁 id=1）
 *   - 写完主动删缓存，下一次 getSetting 强制查库拿最新值
 */
export async function updateSetting(update: UpdateInfo): Promise<SettingDTO> {
    // 1) 直接按固定主键 id=1 更新
    const [affectedCount] = await Setting.update(update, { where: { id: SINGLETON_ID } });
    if (affectedCount === 0) {
        // 表里还没任何行 → 创建一行（带 update 的字段合并进默认值）；beforeSave 钩子自动 id=1
        await Setting.create(update as any);
    }

    // 2) 使缓存失效（管理员点"保存设置"后下一次页面加载一定看到最新）
    cache.delete(CACHE_KEY);

    // 3) 返回保存后的最新完整数据（给前端回填用；顺便保证没有行就自动创建默认行）
    return await getSetting();
}
