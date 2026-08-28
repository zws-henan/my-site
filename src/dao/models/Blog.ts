import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";
import {BlogTypeAttributes} from "./BlogType.js";

// TOC 项类型（与 schemas/blogSchema.ts 中的 TocItem 保持一致）
export interface TocItem {
    name: string;
    anchor: string;
    children?: TocItem[];
}

// Blog 创建时需要的属性（不含数据库自动生成的字段）
export interface BlogCreationAttributes {
    title: string;
    description: string;
    toc: TocItem[];
    htmlCotent: string;
    thumb: string;
    scanNumber: number;
    commentNumber: number;
    createDate: Date;
    categoryId: number;
}

// Blog 完整属性（含数据库自动生成的字段）
export interface BlogAttributes extends BlogCreationAttributes {
    id: number;
    category:BlogTypeAttributes;
    markdownContent:string;
    deletedAt: Date | null;
}

const Blog = sequelize.define<Model<BlogAttributes>, BlogCreationAttributes>("Blog", {
    title:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    description:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    toc:{
        type: DataTypes.JSON,
        allowNull: false,
    },
    htmlCotent:{
        type: DataTypes.TEXT,
        allowNull: false,
    },
    thumb:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    scanNumber:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    commentNumber:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    createDate:{
        type: DataTypes.DATE,
        allowNull: false,
    },
    categoryId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'BlogType',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
},{
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});

export default Blog;
