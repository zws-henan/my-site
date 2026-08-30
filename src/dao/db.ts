// 负责对数据库进行初始化

import admin from "./models/Admin.js";
import banner from "./models/Banner.js";
import BlogType from "./models/BlogType.js";
import Blog from "./models/Blog.js";
import "./models/Demo.js";
import Message from "./models/Message.js";
import Setting from "./models/Setting.js";



import sequelize from "./dbConnect.js";

import md5 from 'md5';

// 同步所有模型
try {
    // 定义模型之间的关系
    BlogType.hasMany(Blog, { foreignKey: "categoryId", sourceKey: "id" });
    Blog.belongsTo(BlogType,{foreignKey:'categoryId',targetKey:'id',as:'category'});

    Blog.hasMany(Message, { foreignKey: "blogId", sourceKey: "id" });
    Message.belongsTo(Blog,{foreignKey:'blogId',targetKey:'id',as:'blog'});
    await sequelize.sync({
        alter:true
    });
    const adminCount= await admin.count();
    if(!adminCount){
        await admin.create({
            loginId:'admin',
            loginPwd:md5('123456'),
            name:'管理员'
        })
        console.log('Admin account created successfully.');
    }
    const bannerCount= await banner.count();
    if(!bannerCount){
        await banner.bulkCreate([{
            "midImg": "/static/images/bg1_mid.jpg",
            "bigImg": "/static/images/bg1_big.jpg",
            "title": "塞尔达旷野之息",
            "description": "2017年年度游戏，期待续作"
        }, {
            "midImg": "/static/images/bg2_mid.jpg",
            "bigImg": "/static/images/bg2_big.jpg",
            "title": "塞尔达四英杰",
            "description": "四英杰里面你最喜欢的又是谁呢"
        }, {
            "midImg": "/static/images/bg3_mid.jpg",
            "bigImg": "/static/images/bg3_big.jpeg",
            "title": "日本街道",
            "description": "动漫中经常出现的日本农村街道，一份独特的恬静"
        }])
        console.log('Banner account created successfully.');
    }
    const settingCount= await Setting.count();
    if(!settingCount){
        await Setting.create({
            avatar:'/static/avatar.jpeg',
            siteTitle:'我的个人博客',
            github:'https://github.com/',
            qq:'2357838130@qq.com',
            qqQrCode:'/static/qrcode/default_qq.png',
            weixin:'aaaaa',
            weixinQrCode:'/static/qrcode/default_weixin.png',
            mail:'2357838130@qq.com',
            icp:'豫ICP备00000000号',
            githubName:'',
        })
        console.log('Setting account created successfully.');
    }
    console.log('All models have been synchronized successfully.');
} catch (error) {
    console.error('Unable to sync the database:', error);
}
