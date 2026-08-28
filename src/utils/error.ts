import { formatResponse } from "./tool.js";

class ServiceError extends Error {
    code: number;
    constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
    toResponseJson() {
        return formatResponse(this.code, this.message, null);
    }
}

export default ServiceError;

// 上传错误（文件过大等）
export const UploadError = class extends ServiceError {
    constructor(message: string, code: number = 413) {
        super(message, code);
    }
}

// 未授权错误（401）
export const UnauthorizedError = class extends ServiceError {
    constructor(message: string = "未授权", code: number = 401) {
        super(message, code);
    }
}

// 禁止访问错误（403）
export const ForbiddenError = class extends ServiceError {
    constructor(message: string = "禁止访问", code: number = 403) {
        super(message, code);
    }
}

// 验证错误（406）
export const ValidateError = class extends ServiceError {
    constructor(message: string, code: number = 406) {
        super(message, code);
    }
}

// 404
export const NotFoundError = class extends ServiceError {
    constructor(message: string = "404错误", code: number = 404) {
        super(message, code);
    }
}

// 未知错误（500）
export const UnknownError = class extends ServiceError {
    constructor(message: string = "未知错误", code: number = 500) {
        super(message, code);
    }
}
