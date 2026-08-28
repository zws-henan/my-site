import 'express-serve-static-core';

// 扩展 Express 的 Request 类型，添加 multer 的文件上传属性
declare global {
  namespace Express {
    interface Request {
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        destination: string;
        filename: string;
        path: string;
        size: number;
      };
      files?: {
        [fieldname: string]: {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          destination: string;
          filename: string;
          path: string;
          size: number;
        }[];
      };
    }
  }
}

export {};
