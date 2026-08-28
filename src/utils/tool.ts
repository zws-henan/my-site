import jwt from 'jsonwebtoken';
import md5 from 'md5';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from "url";
import { BlogInfo } from '../dao/blogDao.js';
import toc from 'markdown-toc';
import type { TocItem } from '../dao/models/Blog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Response<T> {
    code: number;
    msg: string;
    data: T;
}
interface TokenPayload {
    loginId: string;
    name: string;
    id: number;
}
export function formatResponse<T>(code: number, msg: string, data = null as T): Response<T> {
    return {
        code,
        msg,
        data,
    };
}

export function analysisToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, md5(process.env.JWT_SECRET));
    return decoded as TokenPayload;
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, '../../public/static/upload'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}` + path.extname(file.originalname));
    },
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
        files: 1,
    },
});

interface RawTocItem {
    content: string;
    slug: string;
    lvl: number;
    i: number;
    seen: number;
}

export function handleTOC(content: BlogInfo): BlogInfo {
    const result = toc(content.markdownContent).json;

    function transfer(arr: RawTocItem[]): TocItem[] {
        const rootList: TocItem[] = [];
        const stack: TocItem[] = [];

        for (const raw of arr) {
            const node: TocItem = {
                name: raw.content,
                anchor: raw.slug,
            };
            const level = raw.lvl;

            while (stack.length >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                rootList.push(node);
            } else {
                const parent = stack[stack.length - 1];
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(node);
            }

            stack.push(node);
        }

        return rootList;
    }

    // 给 HTML 的 h1~h6 标题加上 id=slug
    function addHeadingIds(html: string, items: RawTocItem[]): string {
        let result = html;
        for (const item of items) {
            const tag = `h${item.lvl}`;
            // 先转义正则特殊字符
            const escaped = item.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 匹配 <hX>content</hX> 或 <hX ...>content</hX>（不含 id 属性）
            const regex = new RegExp(
                `<(${tag})(\\s(?!id=)[^>]*)?>\\s*${escaped}\\s*</${tag}>`,
                'gi'
            );
            result = result.replace(
                regex,
                (match, tagName, attrs = '') => {
                    if (/id=/.test(match)) return match;
                    return `<${tagName}${attrs} id="${item.slug}">${item.content}</${tagName}>`;
                }
            );
        }
        return result;
    }

    content.toc = transfer(result);
    content.htmlCotent = addHeadingIds(content.htmlCotent, result);
    return content;
}
