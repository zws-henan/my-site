import sequelize from "../dbConnect.js";
import { DataTypes } from "sequelize";

const Admin = sequelize.define('Admin', {
    loginId:{
        type:DataTypes.STRING,
        allowNull:false
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    loginPwd:{
        type:DataTypes.STRING,
        allowNull:false
    }
},{
    freezeTableName:true,
    createdAt:false, // 不自动添加 createdAt 字段
    updatedAt:false, // 不自动添加 updatedAt 字段
    paranoid:true // 开启软删除。记录删除的时间
});

export default Admin;
