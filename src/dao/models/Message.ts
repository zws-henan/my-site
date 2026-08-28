import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";
import Blog from "./Blog.js";


export interface MessageCreationAttributes {
    nickname: string;
    content: string;
    createDate?: string;       // 后端处理默认值，前端可不传
    avatar?: string;           // 后端处理默认头像，前端可不传
    blogId?: number | null;    // 可传可不传：null/不传=全局留言，有值=对应博客的留言
}

// Blog 完整属性（含数据库自动生成的字段）
export interface MessageAttributes extends MessageCreationAttributes {
    id: number;
    createDate: string;        // 数据库行上一定有值（由后端补默认值后写入）
    avatar: string;            // 数据库行上一定有值（由后端补默认头像后写入）
    blogId: number | null;
    deletedAt: Date | null;
}

const Message = sequelize.define<Model<MessageAttributes>, MessageCreationAttributes>('message', {
    nickname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createDate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // 留言归属博客的外键（可空：null 表示全局留言，非空表示某篇博客下的留言）
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Blog,
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
},{
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});
export default Message;
