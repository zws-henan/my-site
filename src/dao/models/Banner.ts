import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";

// 1. 创建时需要的属性（不含数据库自动生成的字段）
export interface BannerCreationAttributes {
    midImg: string;
    bigImg: string;
    title: string;
    description: string;
}

// 2. 完整的属性（含数据库自动生成的字段）
export interface BannerAttributes extends BannerCreationAttributes {
    id: number;
    deletedAt: Date | null;
}

// 3. define<ModelType, AttributesType>
//    第一个泛型：模型实例的完整类型（用于查询返回）
//    第二个泛型：define 第二个参数的属性类型（用于定义字段）
const Banner = sequelize.define<Model<BannerAttributes>, BannerCreationAttributes>('Banner', {
    midImg: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bigImg: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});

export default Banner;
