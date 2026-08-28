import Admin from "./models/Admin.js";
import { Model } from "sequelize";

interface LoginInfo {
    loginId: string;
    loginPwd: string;
}
interface UpdateInfo {
    loginId: string;
    name: string;
    loginPwd: string;
}

// Admin 模型的实例类型
export interface AdminInstance extends Model {
    dataValues: {
        id: number;
        loginId: string;
        name: string;
        loginPwd: string;
        deletedAt: Date | null;
    };
}

export async function loginDao(loginInfo: LoginInfo): Promise<AdminInstance | null> {
    return await Admin.findOne({
        where: {
            loginId: loginInfo.loginId,
            loginPwd: loginInfo.loginPwd
        }
    }) as AdminInstance | null;
}

export async function updateAdminDao(info: UpdateInfo): Promise<[number]> {
    return await Admin.update(info, {
        where: {
            loginId: info.loginId
        }
    });
}
