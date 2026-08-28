import express, { Request, Response, NextFunction } from 'express';
import { formatResponse,handleTOC } from '../utils/tool.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { CreateBlogSchema, UpdateBlogSchema, BlogIdSchema, BlogQuerySchema, BlogIdParams, BlogQueryParams } from '../schemas/blogSchema.js';
import { addBlogService, finBlogService, findBlogByIdService, updateBlogService, delBlogService } from '../service/blogService.js';

const BlogRouter = express.Router();

// POST /api/blog - 创建博客
BlogRouter.post('/', validateBody(CreateBlogSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await addBlogService(req.body);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// GET /api/blog - 获取所有博客（支持分页）
BlogRouter.get('/', validateQuery(BlogQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 添加默认值
        const { page = 1, limit = 10, keyword = '', categoryId = -1 } = req.query as BlogQueryParams;
        const data = await finBlogService({ page, limit, keyword, categoryId });
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// GET /api/blog/:id - 根据ID获取博客
BlogRouter.get('/:id', validateParams(BlogIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogIdParams;
        const reqHeader = req.headers;
        const data = await findBlogByIdService(id,reqHeader);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// DELETE /api/blog/:id - 删除博客
BlogRouter.delete('/:id', validateParams(BlogIdSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogIdParams;
        const data = await delBlogService(id);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

// PUT /api/blog/:id - 更新博客
BlogRouter.put('/:id', validateParams(BlogIdSchema), validateBody(UpdateBlogSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as BlogIdParams;
        const data = await updateBlogService(id, req.body);
        res.send(formatResponse(0, '', data));
    } catch (err) {
        next(err);
    }
});

export default BlogRouter;
