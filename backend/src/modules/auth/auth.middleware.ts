import type { RequestHandler } from 'express';
import { jwtVerify } from 'jose';
import { env } from '@/env';
import { asyncHandler } from '@/shared/asyncHandler';
import { AppError } from '@/shared/errors';
import {
  createAuthRepository,
  type AuthRepository,
} from '@/modules/auth/auth.repository';
import type { UserRole } from '@/modules/auth/auth.types';

const jwtSecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

// O Supabase Auth assina JWTs HS256 com o JWT secret do projeto e
// audience "authenticated". Validamos assinatura, expiração e audience —
// sem ida ao banco, para manter o middleware barato em toda request.
export const requireAuth: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new AppError('Token de acesso ausente', {
        statusCode: 401,
        code: 'auth_missing_token',
      });
    }

    try {
      const { payload } = await jwtVerify(token, jwtSecret, {
        audience: 'authenticated',
      });
      if (!payload.sub) throw new Error('sub ausente');

      req.auth = {
        userId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };
    } catch {
      throw new AppError('Token inválido ou expirado', {
        statusCode: 401,
        code: 'auth_invalid_token',
      });
    }

    next();
  },
);

// Autorização por role consulta public.users (fonte da verdade de role e
// is_active). Use apenas em rotas sensíveis — ex.: DELETE — para não pagar
// uma query por request em rotas de leitura.
export function createRequireRole(
  role: UserRole,
  repository: AuthRepository = createAuthRepository(),
): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    if (!req.auth) {
      throw new AppError('Token de acesso ausente', {
        statusCode: 401,
        code: 'auth_missing_token',
      });
    }

    const user = await repository.findUserById(req.auth.userId);

    if (!user || !user.is_active) {
      throw new AppError('Usuário inativo ou não cadastrado', {
        statusCode: 403,
        code: 'auth_user_inactive',
      });
    }

    if (role === 'admin' && user.role !== 'admin') {
      throw new AppError('Ação restrita a administradores', {
        statusCode: 403,
        code: 'auth_forbidden',
      });
    }

    next();
  });
}
