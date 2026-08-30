import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";

/**
 * 【单例配置表】全站只会有 1 条记录（id 恒等于 1）
 *  存储：站点标题、备案号、社交链接、二维码、favicon 等"后台设置"里的内容
 *  设计要点：
 *    1) id 强制=1：用 beforeSave 钩子在写入前强制把 id 设成 1（Sequelize v6 不推荐在 define attributes 里显式写 id，改用钩子统一锁住，避免 TS "id 不是 ModelAttributes 已知属性"报错）
 *    2) 去掉 paranoid 软删：单行表软删没有任何意义，删了就没配置了，还会让 findOne 因为 deletedAt 查不到正确行
 *    3) 所有配置列 allowNull: false + 有默认占位字符串，首次启动能自动 INSERT 出默认行，DAO 层 get/update 永远不用判空
 */

// 1. 创建时需要的属性（不含数据库自动生成的字段；id 用钩子锁死，用户创建时不用传，Sequelize 会自动加）
export interface SettingCreationAttributes {
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

// 2. 查询返回的完整属性（单行配置永远只有 1 条，id 是 number）
export interface SettingAttributes extends Required<SettingCreationAttributes> {
    id: number;
}

// 3. define<ModelType, AttributesType>
//    【注意】Sequelize v6 会自动给模型加上自增主键 id，不在 define 第二个参数里显式写 id 列定义
//    （否则 TS 会报 "对象字面量只能指定已知属性，并且 id 不在类型 ModelAttributes 中"，就是你看到的错误）
//    我们用 beforeSave 钩子把写入的任何 id 强改成 1，实现"永远只有 1 行配置"。
const Setting = sequelize.define<Model<SettingAttributes>, SettingCreationAttributes>('Setting', {
    avatar: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '/static/default_avatar.png',
        comment: '站长头像默认地址',
    },
    siteTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '我的个人博客',
        comment: '站点标题（SEO + 首页导航展示）',
    },
    github: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://github.com/',
        comment: 'GitHub 个人主页链接',
    },
    qq: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
        comment: '站长 QQ 号',
    },
    qqQrCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '/static/qrcode/default_qq.png',
        comment: 'QQ 二维码图片地址',
    },
    weixin: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
        comment: '站长微信号',
    },
    weixinQrCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '/static/qrcode/default_weixin.png',
        comment: '微信二维码图片地址',
    },
    mail: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin@example.com',
        comment: '站长联系邮箱',
    },
    icp: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '豫ICP备00000000号',
        comment: '备案号（页脚展示）',
    },
    githubName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
        comment: 'GitHub 昵称展示',
    },
    favicon: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '/favicon.ico',
        comment: '网站 favicon 地址',
    }
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: false,   // ✅ 单行表绝对不要软删：软删会导致出现 N 条 deletedAt 非空的历史行，findOne 时经常拿不到配置
    // 🔒 用 beforeSave 钩子「写入前强制 id=1」，从根本上杜绝插入 id!=1 的第二条配置行
    hooks: {
        beforeSave(instance) {
            (instance as any).id = 1;
        },
    },
});

export default Setting;
