import express from 'express';
import { captchaService } from '../service/captchaService.js';

const captchaRouter = express.Router();

captchaRouter.get('/',async (req,res)=>{
    const data = await captchaService();
    (req as any).session.captcha = data.text;
    res.setHeader("Content-Type","image/svg+xml");
    res.send(data.data);
})

export default captchaRouter;
