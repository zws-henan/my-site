import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import ServiceError from '../utils/error.js';

/**
 * 验证请求体的中间件工厂
 * @param schema zod schema
 * @returns Express 中间件
 */
export function validateBody<T>(schema: ZodSchema<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync(req.body);
            req.body = parsed;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors = err.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                next(new ValidationError('数据验证失败', 400, errors));
            } else {
                next(err);
            }
        }
    };
}

/**
 * 验证请求参数的中间件工厂
 * @param schema zod schema
 * @returns Express 中间件
 */
export function validateParams<T>(schema: ZodSchema<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync(req.params);
            req.params = parsed as any;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors = err.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                next(new ValidationError('参数验证失败', 400, errors));
            } else {
                next(err);
            }
        }
    };
}

/**
 * 验证查询参数的中间件工厂
 * @param schema zod schema
 * @returns Express 中间件
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync(req.query);
            req.query = parsed as any;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors = err.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                next(new ValidationError('查询参数验证失败', 400, errors));
            } else {
                next(err);
            }
        }
    };
}

/**
 * 验证错误类
 */
export class ValidationError extends ServiceError {
    errors: Array<{ field: string; message: string }>;
    
    constructor(message: string, code: number = 400, errors: Array<{ field: string; message: string }> = []) {
        super(message, code);
        this.errors = errors;
    }
    
    toResponseJson() {
        return {
            code: this.code,
            msg: this.message,
            data: {
                errors: this.errors
            }
        };
    }
}

// 导出 zod 方便使用
export { z };
