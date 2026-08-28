import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { expressjwt } from 'express-jwt';
import session from 'express-session';
import md5 from 'md5';
import "express-async-errors"
import ServiceError, { ForbiddenError, UnauthorizedError, UnknownError } from './utils/error.js';
import { ValidationError } from './middleware/validate.js';
//引入路由
import adminRouter from './routes/admin.js';
import captchaRouter from './routes/captcha.js';
import bannerRouter from './routes/banner.js';
import uploadRouter from './routes/upload.js';
import blogTypeRouter from './routes/blogType.js';
import blogRouter from './routes/blog.js';
import demoRouter from './routes/demo.js';
import messageRouter from './routes/message.js';



import "./dao/db.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 创建服务器实例
const app = express();

// 配置 CORS
app.use(cors({
    origin: true,  // 允许所有来源，支持 credentials
    credentials: true,  // 允许携带 cookie
    exposedHeaders: ['Authorization'],  // 暴露 Authorization 响应头给前端
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 配置session
app.use(session({
  secret: md5(process.env.SESSION_SECRET),
  resave: true, // 无论是否有修改，都重新保存 session
  saveUninitialized: true, // 无论是否有 session，都保存 session
}));

// 配置中间件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use(expressjwt({
  secret: md5(process.env.JWT_SECRET),
  algorithms: [process.env.JWT_ALGORITHM as 'HS256'],
}).unless({
  path:[{
    "url":"/api/admin/login",
    "method":"POST"
  },{
    "url":"/res/captcha",
    "method":"GET"
  },
  {
    "url":"/api/banner",
    "method":"GET"
  },
  {
    "url":/\/api\/blog\/\d+/,
    "method":"GET"
  },{
    "url":"/api/blog",
    "method":"GET"
  },{
    "url":"/api/demo",
    "method":"GET"
  },{
    "url":/\/api\/demo\/\d+/,
    "method":"GET"
  },{
    "url":"/api/blogtype",
    "method":"GET"
  },{
    "url":/\/api\/blogtype\/\d+/,
    "method":"GET"
  },{
    "url":"/api/message",
    "method":"GET"
  },{
    "url":"/api/message",
    "method":"POST"
  },{
    "url":/\/api\/message\/\d+/,
    "method":"GET"
  },{
    "url":"/api/comment",
    "method":"GET"
  },{
    "url":"/api/comment",
    "method":"POST"
  },{
    "url":/\/api\/comment\/\d+/,
    "method":"GET"
  },]
}))

app.use('/res/captcha', captchaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/blogtype', blogTypeRouter);
app.use('/api/blog', blogRouter);
app.use('/api/demo', demoRouter);
app.use('/api/message', messageRouter);
app.use('/api/comment', messageRouter);


// catch 404 and forward to error handler
app.use(function (req: any, res: any, next: any) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
  console.log("err.name:", err.name);
  console.log("err.message:", err.message);
  
  if (err.name === "UnauthorizedError") {
    // express-jwt 的 token 验证失败
    res.status(401).json(new UnauthorizedError("token错误").toResponseJson());
  } else if (err instanceof ValidationError) {
    // zod 验证错误
    res.status(err.code).json(err.toResponseJson());
  } else if (err instanceof ServiceError) {
    // 自定义业务错误
    res.status(err.code).json(err.toResponseJson());
  } else if (err.status === 404) {
    // 404 错误
    res.status(404).json(new ForbiddenError("资源不存在", 404).toResponseJson());
  } else {
    // 未知错误
    console.error("Unhandled error:", err);
    res.status(500).json(new UnknownError(err.message).toResponseJson());
  }
});

export default app;
