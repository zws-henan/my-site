import {
    createMessageDao,
    updateMessageDao,
    deleteMessageDao,
    findAllMessageDao,
    findMessageByIdDao,
    MessageInfo,
    FindAllParams as MessageFindAllParams,
    UpdateInfo as MessageUpdateInfo,
} from '../dao/messageDao.js';
import { ValidateError } from '../utils/error.js';
import { MessageCreationAttributes } from '../dao/models/Message.js';
import { decreaseCommentNumberDao, increaseCommentNumberDao } from '../dao/blogDao.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ---------- 默认值 ----------
const defaultCreateDate = (): string => String(Date.now());
function getRandom(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
async function createAvatar(dir: string) {
    return fs.promises.readdir(dir)
        .then(files => files)
        .catch(() => []);
}
// blogId 是"有效的正整数博客 ID"才需要同步 blog.commentNumber，否则(全局留言/null/0)跳过
const isValidBlogId = (blogId: number | null | undefined): blogId is number =>
    typeof blogId === 'number' && Number.isInteger(blogId) && blogId >= 1;

// ---------- 新增留言（avatar/createDate/blogId 可传可不传，后端兜底） ----------
export async function addMessageService(data: MessageCreationAttributes) {
    // MessageCreationAttributes 里 createDate/avatar/blogId 都是可选，Schema 推出来的 DTO 也一致
    const avatar = await createAvatar(path.join(__dirname, '../../public/static/avatar'));
    const randomIndex = avatar && avatar.length > 0 ? getRandom(0, avatar.length - 1) : -1;
    const randomAvatar = randomIndex >= 0 ? avatar[randomIndex] : undefined;

    const finalData: Required<Pick<MessageCreationAttributes, 'nickname' | 'content' | 'createDate' | 'avatar'>> & {
        blogId: number | null;
    } = {
        nickname: data.nickname,
        content: data.content,
        // 真正有随机头像就用，否则退回 static 里的占位默认图（避免 avatar 目录空时取 undefined 入库报错）
        avatar: randomAvatar ? `/static/avatar/${randomAvatar}` : '/static/images/avatar_default.png',
        createDate: defaultCreateDate(),
        blogId: data.blogId ?? null,
    };

    const result = await createMessageDao(finalData);
    if (!result) {
        throw new ValidateError('留言创建失败');
    }
    // 只在"真的关联了博客"时才把博客的评论计数 +1；全局留言（null/0/undefined）不需要改任何博客统计
    if (isValidBlogId(finalData.blogId)) {
        await increaseCommentNumberDao({ id: finalData.blogId });
    }
    const row = result.get({ plain: true });
    const { deletedAt, ...rest } = row;
    void deletedAt;
    return rest as MessageInfo;
}

// ---------- 分页列表 ----------
// blogId 归一化：【业务层规则】→ 三种互斥语义（完全匹配前端 Query 三种传法）
// DAO 层只懂 SQL 语法，不懂 "全局留言 / 所有关联博客" 这种业务概念，所以 normalize 必须放 Service。
function normalizeBlogId(
    raw: unknown
): { kind: 'global' } | { kind: 'blog'; id: number } | { kind: 'attached' } {
    // 1) 明确的"空/不传" → 全部按【全局留言板】处理（我们的默认业务规则）
    if (raw === null || raw === undefined || raw === '') return { kind: 'global' };
    // 2) 数字：-1 / -1.0 → 【所有关联了博客的评论】；≥1 正整数 → 【某博客下】
    if (typeof raw === 'number') {
        if (raw === -1) return { kind: 'attached' };                      // 🆕 业务语义：-1 = 查所有有归属博客的评论
        if (Number.isInteger(raw) && raw >= 1) return { kind: 'blog', id: raw };
        // 0 / 负数(-2,-3...) / 小数：Schema 层 refine 应该已经拦了；没拦住的话兜底 = 全局（至少不会"查出全部"）
        return { kind: 'global' };
    }
    // 3) 字符串：允许 "-1"（所有关联博客）、"9"（正整数某博客）
    if (typeof raw === 'string') {
        if (raw === '-1') return { kind: 'attached' };                    // 🆕 字符串 "-1" → 查所有关联博客
        if (/^\d+$/.test(raw)) {
            const n = Number(raw);
            if (n >= 1) return { kind: 'blog', id: n };
        }
    }
    // 4) 其余乱七八糟的值（'abc'/'0'/'-5'/'null字面量'）→ 兜底按全局查（schema 前面其实已经拦了）
    return { kind: 'global' };
}
export async function findAllMessageService(params: {
    page: number;
    limit: number;
    keyword?: string;
    blogId?: number | null;
}) {
    const { page, limit, keyword, blogId } = params;
    const offset = (page - 1) * limit;

    // 业务语义归一：rawBlogId → 三选一
    const blogFilter = normalizeBlogId(blogId);
    let daoParams: MessageFindAllParams;
    if (blogFilter.kind === 'global') {
        daoParams = { offset, limit, keyword, globalOnly: true };
    } else if (blogFilter.kind === 'attached') {
        daoParams = { offset, limit, keyword, attachedOnly: true };       // 🆕 对应第三态 SQL：blogId IS NOT NULL
    } else {
        daoParams = { offset, limit, keyword, blogId: blogFilter.id };
    }

    const result = await findAllMessageDao(daoParams);
    const count = result.count;
    const rows = result.rows
        .map(item => item.get({ plain: true }))
        .map(item => {
            const { deletedAt, ...rest } = item;
            void deletedAt;
            return rest as MessageInfo;
        });
    return { count, rows };
}

// ---------- 按 ID 查 ----------
export async function findMessageByIdService(id: number) {
    const result = await findMessageByIdDao(id);
    if (!result) {
        // 并发防御 / Zod 层通过后记录被删 的兜底
        throw new ValidateError('留言已被删除，请刷新后重试');
    }
    const row = result.get({ plain: true });
    const { deletedAt, ...rest } = row;
    void deletedAt;
    return rest as MessageInfo;
}

// ---------- 修改留言 ----------
export async function updateMessageService(id: number, data: MessageUpdateInfo) {
    await updateMessageDao(id, data);
    const message = await findMessageByIdDao(id);
    if (!message) {
        throw new ValidateError('留言已被删除，请刷新后重试');
    }
    const row = message.get({ plain: true });
    const { deletedAt, ...rest } = row;
    void deletedAt;
    return rest as MessageInfo;
}

// ---------- 删除留言（软删除）+ 同步对应博客的 commentNumber ----------
export async function deleteMessageService(id: number) {
    // 1) 先把留言查出来，取出 blogId 后面用；顺便并发防御：已经被删了就直接抛提示
    const data = await findMessageByIdDao(id);
    if (!data) {
        throw new ValidateError('留言已被删除，请刷新后重试');
    }
    const row = data.get({ plain: true });
    const blogId = row.blogId;

    // 2) 执行留言删除（软删 paranoid，这里执行完 data 对象里的 deletedAt 会被改写，但我们已经取出 blogId 了）
    await deleteMessageDao(id);

    // 3) 只有"这条留言挂在某篇博客下（blogId 是有效的正整数）"才扣减博客评论数
    //    全局留言（blogId = null / 0 / undefined）不需要动任何博客的统计
    if (isValidBlogId(blogId)) {
        await decreaseCommentNumberDao({ id: blogId });
    }
    return true;
}
