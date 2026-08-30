import express, { Request, Response, NextFunction } from 'express';
import { formatResponse } from '../utils/tool.js';
import { ValidateError } from '../utils/error.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
    CreateSettingSchema,
    UpdateSettingSchema,
    SettingIdSchema,
    SettingQuerySchema,
} from '../schemas/settingSchema.js';
import type {
    CreateSettingDto,
    UpdateSettingDto,
    SettingIdParams,
    SettingQueryParams,
} from '../schemas/settingSchema.js';
import {
    getSettingService,
    updateSettingService,
} from '../service/settingService.js';

const settingRouter = express.Router();

// ------------------------------------------------------------------
// POST /api/setting - 创建新的全局配置（【单行表语义】实际不允许 INSERT 第二条，返回 400 提示"请走 PUT 修改"）
// 保留这个接口是为了和 Banner/Blog/Message 统一「5 接口 CRUD」风格
// ------------------------------------------------------------------
settingRouter.post(
    '/',
    validateBody(CreateSettingSchema),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            // Setting 永远只有 id=1 的一行（beforeSave 钩子锁死 id=1，再 INSERT 会主键冲突）
            // 所以直接告诉前端：请用 PUT /api/setting/1 修改现有配置，不要 POST 新建
            throw new ValidateError(
                '全局配置只有 1 条（id=1），不允许新增第二条；请调用 PUT /api/setting/1 直接修改现有配置'
            );
            // （理论上不会走到下面，仅做类型对齐）
            void _req.body as CreateSettingDto;
            res.send(formatResponse(0, '', null));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// GET /api/setting - 分页列表（【单行表语义】忽略 page/limit/keyword，只返回那 1 条全局配置）
// 【JWT 白名单】前台首页 / 博客详情页 / 页脚渲染 站点标题/favicon/备案号 → 匿名能读
// ------------------------------------------------------------------
settingRouter.get(
    '/',
    validateQuery(SettingQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const _query = req.query as unknown as SettingQueryParams;
            void _query;  // 单行表 page/limit/keyword 没有意义，但保留校验和类型对齐
            const data = await getSettingService();
            // 为了和其他「分页列表」接口返回结构统一（{ count, rows }），这里包一层
            res.send(formatResponse(0, '', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// GET /api/setting/:id - 按 ID 查详情（【单行表语义】SettingIdSchema 已经锁死 id 必须=1）
// 【JWT 白名单】管理员后台回填设置表单 / 前端详情页 → 匿名能读
// ------------------------------------------------------------------
settingRouter.get(
    '/:id',
    validateParams(SettingIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const _id = (req.params as SettingIdParams).id;
            void _id;   // Schema 已经确保是 1，Service 层永远固定读 id=1
            const data = await getSettingService();
            res.send(formatResponse(0, '查询成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// PUT /api/setting/:id - 修改全局配置（需要后台登录 JWT）
// 【单行表语义】SettingIdSchema 锁死只能改 id=1 那一条
// ------------------------------------------------------------------
settingRouter.put(
    '/:id',
    validateParams(SettingIdSchema),
    validateBody(UpdateSettingSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const _id = (req.params as SettingIdParams).id;
            void _id;   // Schema 已经确保是 1
            const body = req.body as UpdateSettingDto;
            const data = await updateSettingService(body);
            res.send(formatResponse(0, '保存成功', data));
        } catch (err) {
            next(err);
        }
    }
);

// ------------------------------------------------------------------
// DELETE /api/setting/:id - 删除全局配置（【单行表语义】不允许删除站点基本配置）
// 保留接口是为了和其他模块统一 CRUD；实际返回 400 提示"不能删除全局配置"
// ------------------------------------------------------------------
settingRouter.delete(
    '/:id',
    validateParams(SettingIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const _id = (req.params as SettingIdParams).id;
            void _id;
            throw new ValidateError('全局配置（站点标题/备案号/二维码等）不能删除；如需清空请调用 PUT 接口设置为空字符串');
            // （类型对齐占位）
            res.send(formatResponse(0, '', null));
        } catch (err) {
            next(err);
        }
    }
);

export default settingRouter;
