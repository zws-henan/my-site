import express, { Request, Response, NextFunction } from 'express';
import { formatResponse } from '../utils/tool.js';
import { ValidateError } from '../utils/error.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
    CreateDemoSchema,
    UpdateDemoSchema,
    DemoIdSchema,
    DemoQuerySchema,
} from '../schemas/demoSchema.js';
import type {
    UpdateDemoDto,
    DemoIdParams,
    DemoQueryParams,
} from '../schemas/demoSchema.js';
import type { DemoInfo } from '../dao/demoDao.js';


import {
    addDemoService,
    updateDemoService,
    findAllDemoService,
    findDemoByIdService,
    deleteDemoService,
} from '../service/demoService.js';

const demoRouter = express.Router();

// POST /api/demo - 新增（骨架里没写，顺手补上）
demoRouter.post(
    '/',
    validateBody(CreateDemoSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body as DemoInfo;
            const data = await addDemoService(body);
            res.send(formatResponse(0, '创建成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// GET /api/demo - 查询列表（支持分页/关键词筛选）
demoRouter.get(
    '/',
    validateQuery(DemoQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query as unknown as DemoQueryParams;
            const { page = 1, limit = 10, keyword = '' } = query;
            const data = await findAllDemoService({ page, limit, keyword });
            res.send(formatResponse(0, '', data));
        } catch (err) {
            next(err);
        }
    }
);

// GET /api/demo/:id - 按ID查询
demoRouter.get(
    '/:id',
    validateParams(DemoIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as DemoIdParams;
            const data = await findDemoByIdService(id);
            res.send(formatResponse(0, '查询成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// PUT /api/demo/:id - 修改
demoRouter.put(
    '/:id',
    validateParams(DemoIdSchema),
    validateBody(UpdateDemoSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as DemoIdParams;
            const body = req.body as DemoInfo;
            const data = await updateDemoService(id, body);

            res.send(formatResponse(0, '修改成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// DELETE /api/demo/:id - 删除
demoRouter.delete(
    '/:id',
    validateParams(DemoIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as DemoIdParams;
            const data = await deleteDemoService(id);
            res.send(formatResponse(0, '删除成功', data));
        } catch (err) {
            next(err);
        }
    }
);

export default demoRouter;
