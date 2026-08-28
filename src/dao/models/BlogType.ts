import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";

// 1. 创建时需要的属性（不含数据库自动生成的字段）
export interface BlogTypeCreationAttributes {
    name: string;
    articleCount: number;
    order: number;
}

export interface BlogTypeAttributes extends BlogTypeCreationAttributes {
    id: number;
    deletedAt: Date | null;
}

const BlogType = sequelize.define<Model<BlogTypeAttributes>, BlogTypeCreationAttributes>("BlogType", {
    name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    articleCount:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    order:{
        type: DataTypes.INTEGER,
        allowNull: false,
    }
},{
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});

export default BlogType;