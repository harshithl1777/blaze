import { NextRequest, NextResponse } from 'next/server';
import { routes } from '@/config';
import { ADMIN, HTTPMethods, USER } from '@/types/constants';
import ValidationMiddleware from '@/middleware/validation';
import AuthorizationMiddleware from '@/middleware/authorization';
import { APIUtils } from './utils';

export async function middleware(req: NextRequest) {
    const { pathname } = new URL(req.url);

    if (req.method === 'OPTIONS') {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', 'https://tryblaze.netlify.app');
        response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
        response.headers.set(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Authorization, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        );
        return response;
    }

    const pathConfiguration = Object.entries(routes).find(([path]) => {
        const pathRegex = new RegExp(`^${path.replace(':id', '[^/]+')}$`);
        return pathRegex.test(pathname);
    });

    if (!pathConfiguration || !(req.method in pathConfiguration[1])) {
        return APIUtils.createNextResponse({
            success: false,
            status: 400,
            message: 'Invalid path or method not allowed',
        });
    }

    const routeConfiguration = pathConfiguration[1][req.method as HTTPMethods];
    if (!routeConfiguration) return NextResponse.next();

    if (routeConfiguration.schema) {
        const response = await ValidationMiddleware(req, routeConfiguration.schema);
        if (response) return response;
    }

    const response = NextResponse.next();

    if ([USER, ADMIN].includes(routeConfiguration.access)) {
        const { success, payload } = await AuthorizationMiddleware(req);
        if (!success) {
            return APIUtils.createNextResponse({ success: false, status: 400, message: 'Invalid or expired token' });
        }

        if (routeConfiguration.access === ADMIN && 'isAdmin' in payload! && !payload!.isAdmin) {
            return APIUtils.createNextResponse({
                success: false,
                status: 403,
                message: 'Forbidden: Admin access is required',
            });
        }

        response.headers.set('x-user', JSON.stringify(payload));
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};
