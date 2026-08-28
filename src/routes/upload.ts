import express, { Request, Response, NextFunction } from 'express';
import { upload, formatResponse } from '../utils/tool.js';
import { UploadError } from '../utils/error.js';

const uploadRouter = express.Router();

uploadRouter.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            throw new UploadError('没有上传文件', 400);
        }
        
        const filePath = `/static/upload/${req.file.filename}`;
        res.send(formatResponse(1, "上传成功", filePath));
    } catch (err) {
        next(err);
    }
});

export default uploadRouter;
