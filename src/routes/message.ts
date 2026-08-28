import express, { Request, Response, NextFunction } from 'express';
import { formatResponse } from '../utils/tool.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
    CreateMessageSchema,
    UpdateMessageSchema,
    MessageIdSchema,
    MessageQuerySchema,
} from '../schemas/messageSchema.js';
import type {
    CreateMessageDto,
    UpdateMessageDto,
    MessageIdParams,
    MessageQueryParams,
} from '../schemas/messageSchema.js';
import {
    addMessageService,
    updateMessageService,
    findAllMessageService,
    findMessageByIdService,
    deleteMessageService,
} from '../service/messageService.js';

const messageRouter = express.Router();

// ------------------------------------------------------------------
// POST /api/message - 游客发布新留言（开放给所有用户）
// ------------------------------------------------------------------
messageRouter.post(
    '/',
    validateBody(CreateMessageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body as CreateMessageDto;
            const data = await addMessageService(body);
            res.send(formatResponse(0, '留言成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// GET /api/message - 分页列表（支持关键词搜索；对游客开放）
// ------------------------------------------------------------------
messageRouter.get(
    '/',
    validateQuery(MessageQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query as unknown as MessageQueryParams;
            const { page = 1, limit = 10, keyword = '' } = query;
            // 三重兜底：
            //   1) validateQuery 已经把 blogIdSchemaForQuery parse 完回写到 req.query（undefined→null）
            //   2) 解构 blogId 左值默认值 = null（应对 query.blogId 是 undefined 的竞态）
            //   3) 最后再加 ?? null（极端情况下任何 falsy 串都强制归一到 null）
            // 这样 DAO normalizeBlogIdFilter 一定收到 null → 严格按全局留言查。
            const rawBlogId = (query as any).blogId;
            const blogId = (rawBlogId ?? null) as number | null;
            const data = await findAllMessageService({ page, limit, keyword, blogId });
            res.send(formatResponse(0, '', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// GET /api/message/:id - 按 ID 查详情（对游客开放）
// ------------------------------------------------------------------
messageRouter.get(
    '/:id',
    validateParams(MessageIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as MessageIdParams;
            const data = await findMessageByIdService(id);
            res.send(formatResponse(0, '查询成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// PUT /api/message/:id - 修改留言（需要后台登录；JWT 不在白名单里，默认拦住）
// ------------------------------------------------------------------
messageRouter.put(
    '/:id',
    validateParams(MessageIdSchema),
    validateBody(UpdateMessageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as MessageIdParams;
            const body = req.body as UpdateMessageDto;
            const data = await updateMessageService(id, body);
            res.send(formatResponse(0, '修改成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// DELETE /api/message/:id - 删除留言（需要后台登录；JWT 默认拦住）
// ------------------------------------------------------------------
messageRouter.delete(
    '/:id',
    validateParams(MessageIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as MessageIdParams;
            const data = await deleteMessageService(id);
            res.send(formatResponse(0, '删除成功', data));
        } catch (err) {
            next(err);
        }
    }
);

export default messageRouter;
