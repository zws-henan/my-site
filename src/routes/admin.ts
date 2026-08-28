import express from 'express';
import {login,updateAdmin} from '../service/adminService.js';
import { formatResponse,analysisToken } from '../utils/tool.js';
import { ValidateError } from '../utils/error.js';

const adminRouter = express.Router();


adminRouter.post('/login',async function(req,res,next){
    // 验证验证码
    const sessionCaptcha = (req as any).session?.captcha;
    const bodyCaptcha = req.body.captcha;
    
    if(!sessionCaptcha){
        throw new ValidateError('请先获取验证码', 400);
    }
    if(!bodyCaptcha){
        throw new ValidateError('请输入验证码', 400);
    }
    if(sessionCaptcha.toLowerCase() !== bodyCaptcha.toLowerCase()){
        throw new ValidateError('验证码错误', 400);
    }
    
    // 验证成功后清除验证码，防止重复使用
    delete (req as any).session.captcha;
    
    const result = await login({loginId:req.body.loginId,loginPwd:req.body.loginPwd,remember:req.body.remember});
    
    if(result != null && result.token){
        res.setHeader('authorization','Bearer '+result.token);
        res.send(formatResponse(0,"",result.data));
    }else{
        res.send('login failed');
    }
})

adminRouter.get('/whoami',async function(req,res,next){
    const token = req.get('Authorization').split(' ')[1];
    res.send(formatResponse(0,"",{
        id:analysisToken(token).id,
        loginId:analysisToken(token).loginId,
        name:analysisToken(token).name,
    }));
})

adminRouter.put('/',async function(req,res,next){
    const result = await updateAdmin({
        loginId:req.body.loginId,
        name:req.body.name,
        loginPwd:req.body.loginPwd,
        oldLoginPwd:req.body.oldLoginPwd,
    });
    res.send(formatResponse(0,"",result));
})

export default adminRouter;