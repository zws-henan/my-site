import express, { Request, Response, NextFunction } from 'express';
import banner from '../dao/models/Banner.js';
import { findBanners, updateBanner } from '../service/bannerService.js';
import { formatResponse } from '../utils/tool.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { CreateBannerSchema, UpdateBannerSchema, BannerIdSchema } from '../schemas/bannerSchema.js';

const bannerRouter = express.Router();

// GET /api/banner - 获取所有 Banner
bannerRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await findBanners();
        res.send(formatResponse(0, '查询成功', data));
    } catch (err) {
        next(err);
    }
});

// // POST /api/banner - 创建 Banner（含 zod 验证）
// bannerRouter.post('/', validateBody(CreateBannerSchema), async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // req.body 已经过 zod 验证，类型安全
//         const data = await createBanner(req.body);
//         res.send(formatResponse(0, '创建成功', data));
//     } catch (err) {
//         next(err);
//     }
// });

// PUT /api/banner/:id - 更新 Banner（含 zod 验证）
bannerRouter.put('/',  validateBody(UpdateBannerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = await updateBanner(req.body);
        res.send(formatResponse(0, '更新成功', data));
    } catch (err) {
        next(err);
    }
});

// // DELETE /api/banner/:id - 删除 Banner（含 zod 验证）
// bannerRouter.delete('/:id', validateParams(BannerIdSchema), async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.params;
//         await deleteBanner(id);
//         res.send(formatResponse(0, '删除成功', null));
//     } catch (err) {
//         next(err);
//     }
// });

export default bannerRouter;
