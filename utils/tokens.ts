import { TokenType } from '@/types/constants';
import { User } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
class TokenUtils {
    static isProduction = process.env.NODE_ENV === 'production';
    static accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
    static refreshTokenSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET);
    static accessTokenExpiresIn = TokenUtils.isProduction ? '15m' : '7d';
    static refreshTokenExpiresIn = '7d';
    static refreshTokenExpiresInMS = 604800000;
    static refreshTokenCookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/api/sessions',
        maxAge: this.refreshTokenExpiresInMS,
    };

    static generateAccessToken = async (user: User) => {
        return await new SignJWT({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(TokenUtils.accessTokenExpiresIn)
            .sign(TokenUtils.accessTokenSecret);
    };

    static generateRefreshToken = async (user: User) => {
        return await new SignJWT({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(this.refreshTokenExpiresIn)
            .sign(this.refreshTokenSecret);
    };

    static verifyToken = async (token: string, type: TokenType) => {
        try {
            const { payload } = await jwtVerify(
                token,
                type === TokenType.ACCESS ? this.accessTokenSecret : this.refreshTokenSecret,
            );
            return payload;
        } catch (error: any) {
            return null;
        }
    };
}

export default TokenUtils;
