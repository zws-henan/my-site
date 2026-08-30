import Message, { MessageAttributes, MessageCreationAttributes } from './models/Message.js';
import { Op, WhereOptions, literal, Transaction } from 'sequelize';
import Blog from './models/Blog.js';

// 完整消息类型（DAO 层输出，字段与 MessageAttributes 接口一致）
export type MessageInfo = MessageAttributes;

// 创建 DTO：前端/路由传入的形态（允许不传 createDate/avatar/blogId，Service 层兜底）
// 注意 Message.create() 实际接受 MessageCreationAttributes（可选字段少），
// 所以 Service 在调用 createMessageDao 之前会先把缺的字段补成一定有值。
export type CreateMessageDTO = Partial<MessageCreationAttributes> &
    Pick<MessageCreationAttributes, 'nickname' | 'content'>;

export interface UpdateInfo {
    nickname?: string;
    content?: string;
    createDate?: string;
    avatar?: string;
    blogId?: number | null;
}

// DAO 查询参数：【只接受三种纯 SQL 形态 + 兜底都不传】，不理解"全局留言/关联博客"这种业务语义
//   - 形态 A：{ globalOnly: true }     → WHERE blogId IS NULL         （全局留言板）
//   - 形态 B：{ attachedOnly: true }   → WHERE blogId IS NOT NULL     （所有有归属博客的评论）
//   - 形态 C：{ blogId: number >=1 }   → WHERE blogId = X             （某博客下留言）
//   - 都不传：不加条件（查所有，一般不会用到）
type FindAllParamsBase = {
    offset?: number;
    limit?: number;
    keyword?: string;
};
export type FindAllParams =
    | (FindAllParamsBase & { globalOnly: true;  attachedOnly?: never; blogId?: never })
    | (FindAllParamsBase & { attachedOnly: true; globalOnly?: never; blogId?: never })
    | (FindAllParamsBase & { blogId: number; globalOnly?: never; attachedOnly?: never })
    | (FindAllParamsBase & { globalOnly?: never; attachedOnly?: never; blogId?: never });

// 分页列表查询：支持关键词模糊搜 nickname/content + 限制列数 + 三种过滤形态（互斥）
export async function findAllMessageDao(params: FindAllParams) {
    const { offset, limit, keyword } = params;
    const where: WhereOptions = {};
    if (keyword && keyword.trim().length > 0) {
        (where as any)[Op.or] = [
            { nickname: { [Op.like]: `%${keyword}%` } },
            { content: { [Op.like]: `%${keyword}%` } },
        ];
    }

    // 第一阶段：只设 where 条件（三态互斥，跟 include 解耦，避免漏加）
    if ((params as any).globalOnly === true) {
        (where as any)[Op.and] = literal('blogId IS NULL');
    } else if ((params as any).attachedOnly === true) {
        (where as any)[Op.and] = literal('blogId IS NOT NULL');
    } else if (typeof (params as any).blogId === 'number') {
        (where as any).blogId = (params as any).blogId;
    }
    // else 都不传 → 不加任何条件 → 查全部（兜底，正常不会走到这）

    // 第二阶段：单独决定是否 include Blog（LEFT JOIN，省资源）
    // ✅ 用户确认的优化：全局留言板（blogId IS NULL）不需要 JOIN，省一次数据库查询资源
    //    需要归属博客信息的两种查询（attachedOnly / blogId=N）→ 统一加 Blog include
    // 关键配置（避免 Sequelize JOIN 的经典坑）：
    //   required: false  → LEFT JOIN（即使 Blog 不存在 / 被删，Message 行也不会被吞掉）
    //   paranoid: false  → 关联对象 Blog 被软删也能 JOIN 出字段，不然 Blog 被软删时 Message 里的 blog 直接是 undefined，前端拿不到
    //   attributes: ['id','title'] → 只拿需要的字段，省带宽
    let include: any[] = [];
    if ((params as any).attachedOnly === true || typeof (params as any).blogId === 'number') {
        include = [
            {
                model: Blog,
                as: 'blog',
                required: false,
                paranoid: false,
                attributes: ['id', 'title'],
            },
        ];
    }

    return await Message.findAndCountAll({
        where,
        order: [['id', 'DESC']],
        offset,
        limit,
        include,
    });
}

// 新增留言：入参是“带默认值补全后的创建字段”（Service 层已补好）
export async function createMessageDao(
    params: MessageCreationAttributes & { blogId: number | null },
    t?: Transaction
) {
    return await Message.create(params, { transaction: t });
}

// 修改留言（返回 [affectedCount]）
export async function updateMessageDao(id: number, params: UpdateInfo) {
    return await Message.update(params, { where: { id } });
}

// 删除留言（paranoid 软删除）
export async function deleteMessageDao(id: number, t?: Transaction) {
    return await Message.destroy({ where: { id }, transaction: t });
}

// 按 ID 查单条（软删除过滤：默认只查未删）
export async function findMessageByIdDao(id: number) {
    return await Message.findOne({ where: { id } });
}
