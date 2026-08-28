import { loginDao, updateAdminDao, AdminInstance } from '../dao/adminDao.js';
import jwt from 'jsonwebtoken';
import md5 from 'md5';
import { ValidateError } from '../utils/error.js';


interface AdminData {
    id: number;
    loginId: string;
    name: string;
    loginPwd: string;
    deletedAt: Date | null;
}
interface LoginInfo {
    loginId: string;
    loginPwd: string;
    remember?: number;
}
type LoginResult = {
    token: string;
    data: Omit<AdminData, 'loginPwd' | 'deletedAt'>;
};
interface UpdateInfo {
    name?: string;
    loginPwd?: string;
    oldLoginPwd?: string;
    loginId?: string;
}

export async function login(loginInfo: LoginInfo): Promise<LoginResult | null> {
    loginInfo.loginPwd = md5(loginInfo.loginPwd);
    const admin = await loginDao(loginInfo);
    
    if (!admin || !admin.dataValues) {
        return null;
    }

    const data = admin.dataValues;
    let loginPeriod: number = loginInfo.remember || 1;

    const token = jwt.sign({
        id: data.id,
        loginId: data.loginId,
        name: data.name,
    }, md5(process.env.JWT_SECRET || 'zws'), {
        expiresIn: 60 * 60 * 24 * loginPeriod
    });
    
    const safeData = { ...data };
    delete safeData.loginPwd;
    delete safeData.deletedAt;

    return {
        token,
        data: safeData
    };
}

export async function updateAdmin(updateInfo: UpdateInfo) {
    const result = await loginDao({
        loginId: updateInfo.loginId || '',
        loginPwd: md5(updateInfo.oldLoginPwd || ''),
    });
    
    if (result && result.dataValues) {
        const newPassword = md5(updateInfo.loginPwd || '');
        const info = {
            name: updateInfo.name,
            loginId: updateInfo.loginId,
            loginPwd: newPassword,
        };
        await updateAdminDao(info);
        return {
            id: result.dataValues.id,
            loginId: updateInfo.loginId,
            name: updateInfo.name,
        };
    } else {
        throw new ValidateError("旧密码错误", 406);
    }
}
