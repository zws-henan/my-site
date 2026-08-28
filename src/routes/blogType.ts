import express, { Request, Response, NextFunction } from 'express';
import { addBlogTypeService, findAllBlogTypeService, findBlogTypeByIdService, updateBlogTypeService, delBlogTypeService } from '../service/blogTypeService.js';
import { formatResponse } from '../utils/tool.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { CreateBlogTypeSchema, UpdateBlogTypeSchema, BlogTypeIdSchema, BlogTypeIdParams } from '../schemas/blogTypeSchema.js';

const BlogTypeRouter = express.Router();

// POST /api/blogType - 创建分类
BlogTypeRouter.post('/', validateBody(CreateBlogTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await addBlogTypeService(req.body);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// GET /api/blogType - 获取所有分类
BlogTypeRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await findAllBlogTypeService();
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// GET /api/blogType/:id - 根据ID获取分类
BlogTypeRouter.get('/:id', validateParams(BlogTypeIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogTypeIdParams;
        const data = await findBlogTypeByIdService(id);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// DELETE /api/blogType/:id - 删除分类
BlogTypeRouter.delete('/:id', validateParams(BlogTypeIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogTypeIdParams;
        const data = await delBlogTypeService(id);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// PUT /api/blogType/:id - 更新分类
BlogTypeRouter.put('/:id', validateParams(BlogTypeIdSchema), validateBody(UpdateBlogTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogTypeIdParams;
        const data = await updateBlogTypeService(id, req.body);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

export default BlogTypeRouter;
