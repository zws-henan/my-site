import Demo, { DemoAttributes } from './models/Demo.js';
import { Op } from 'sequelize';

export interface DemoInfo {
    name: string;
    url: string;
    github: string;
    description: string[];
    order: number;
    thumb: string;
}
export interface UpdateInfo{
    name?: string;
    url?: string;
    github?: string;
    description?: string[];
    order?: number;
    thumb?: string;
}
export interface FindInfo {
    page: number;
    limit: number;
    keyword?: string;
}
export type CreateDemoDTO = Omit<DemoAttributes, 'deletedAt'>;

export async function addDemoDao(data: DemoInfo) {
    return await Demo.create(data);
}

export async function findDemoDao(params: {offset?: number, limit?: number, keyword?: string}) {
    return await Demo.findAndCountAll({
        offset: params.offset,
        limit: params.limit,
        where: params.keyword ? { name: { [Op.like]: `%${params.keyword}%` } } : {},
    });
}

export async function updateDemoDao(id: number, params: UpdateInfo) {
    return await Demo.update(params, {
        where: { id },
    });
}

export async function deleteDemoDao(id: number) {
    return await Demo.destroy({
        where: { id },
    });
}

export async function findDemoByIdDao(id: number) {
    return await Demo.findByPk(id);
}