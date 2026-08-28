import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";

// 1. 创建时需要的属性（不含数据库自动生成的字段）
export interface SettingCreationAttributes {
    
}

// 2. 完整的属性（含数据库自动生成的字段）
export interface SettingAttributes extends SettingCreationAttributes {
    id: number;
    deletedAt: Date | null;
}

// 3. define<ModelType, AttributesType>
//    第一个泛型：模型实例的完整类型（用于查询返回）
//    第二个泛型：define 第二个参数的属性类型（用于定义字段）
const Setting = sequelize.define<Model<SettingAttributes>, SettingCreationAttributes>('Setting', {
    avatar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    siteTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    github: {
        type: DataTypes.STRING,
        allowNull: false
    },
    qq: {
        type: DataTypes.STRING,
        allowNull: false
    },
    qqQrCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weixin: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weixinQrCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    githubName: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});

export default Setting;
