import sequelize from "../dbConnect.js";
import { DataTypes, Model } from "sequelize";


export interface DemoCreationAttributes {
    name: string;
    url: string;
    github: string;
    description: string[];
    order: number;
    thumb: string;
}

// Blog 完整属性（含数据库自动生成的字段）
export interface DemoAttributes extends DemoCreationAttributes {
    id: number;
    deletedAt: Date | null;
}

const Demo = sequelize.define<Model<DemoAttributes>, DemoCreationAttributes>('demo', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    github: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.JSON,
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    thumb: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true
});
export default Demo;