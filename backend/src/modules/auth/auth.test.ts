import type { NextFunction, Request, Response } from 'express';
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/errors';
import {
  createRequireRole,
  requireAuth,
} from '@/modules/auth/auth.middleware';
import type { AuthRepository } from '@/modules/auth/auth.repository';
import type { AuthUserRow } from '@/modules/auth/auth.types';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const SECRET = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET as string,
);

const USER_ID = '11111111-1111-1111-1111-111111111111';

async function signToken(
  overrides: {
    sub?: string | null;
    audience?: string;
    expiresIn?: string;
    secret?: Uint8Array;
    email?: string;
  } = {},
): Promise<string> {
  let jwt = new SignJWT({ email: overrides.email ?? 'agente@example.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(overrides.audience ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? '1h');
  if (overrides.sub !== null) jwt = jwt.setSubject(overrides.sub ?? USER_ID);
  return jwt.sign(overrides.secret ?? SECRET);
}

function makeReq(token?: string): Request {
  return {
    header: (name: string) =>
      name.toLowerCase() === 'authorization' && token
        ? `Bearer ${token}`
        : undefined,
  } as unknown as Request;
}

// Roda o middleware e devolve o que chegou no next().
async function run(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
): Promise<{ error: unknown; called: boolean }> {
  return new Promise((resolve) => {
    middleware(req, {} as Response, (err?: unknown) =>
      resolve({ error: err, called: true }),
    );
  });
}

function makeUser(partial: Partial<AuthUserRow> = {}): AuthUserRow {
  return {
    id: USER_ID,
    email: 'agente@example.com',
    full_name: 'Agente Teste',
    role: 'agente',
    is_active: true,
    ...partial,
  };
}

function makeAuthRepoMock(user: AuthUserRow | null): AuthRepository {
  return { findUserById: vi.fn().mockResolvedValue(user) };
}

// ---------------------------------------------------------------------
// requireAuth — validação do JWT do Supabase
// ---------------------------------------------------------------------
describe('requireAuth', () => {
  it('aceita token válido e popula req.auth', async () => {
    const req = makeReq(await signToken());
    const { error } = await run(requireAuth, req);

    expect(error).toBeUndefined();
    expect(req.auth).toEqual({
      userId: USER_ID,
      email: 'agente@example.com',
    });
  });

  it('rejeita request sem header Authorization', async () => {
    const { error } = await run(requireAuth, makeReq());
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      statusCode: 401,
      code: 'auth_missing_token',
    });
  });

  it('rejeita token assinado com outro segredo', async () => {
    const token = await signToken({
      secret: new TextEncoder().encode('outro-segredo-bem-diferente-123'),
    });
    const { error } = await run(requireAuth, makeReq(token));
    expect(error).toMatchObject({ statusCode: 401, code: 'auth_invalid_token' });
  });

  it('rejeita token expirado', async () => {
    const token = await signToken({ expiresIn: '-1h' });
    const { error } = await run(requireAuth, makeReq(token));
    expect(error).toMatchObject({ statusCode: 401, code: 'auth_invalid_token' });
  });

  it('rejeita audience diferente de "authenticated"', async () => {
    const token = await signToken({ audience: 'anon' });
    const { error } = await run(requireAuth, makeReq(token));
    expect(error).toMatchObject({ statusCode: 401, code: 'auth_invalid_token' });
  });

  it('rejeita token sem sub', async () => {
    const token = await signToken({ sub: null });
    const { error } = await run(requireAuth, makeReq(token));
    expect(error).toMatchObject({ statusCode: 401, code: 'auth_invalid_token' });
  });
});

// ---------------------------------------------------------------------
// createRequireRole — autorização via public.users
// ---------------------------------------------------------------------
describe('createRequireRole', () => {
  function makeAuthedReq(): Request {
    const req = makeReq();
    req.auth = { userId: USER_ID };
    return req;
  }

  it('admin passa na exigência de admin', async () => {
    const middleware = createRequireRole(
      'admin',
      makeAuthRepoMock(makeUser({ role: 'admin' })),
    );
    const { error } = await run(middleware, makeAuthedReq());
    expect(error).toBeUndefined();
  });

  it('agente é barrado em rota de admin com 403', async () => {
    const middleware = createRequireRole('admin', makeAuthRepoMock(makeUser()));
    const { error } = await run(middleware, makeAuthedReq());
    expect(error).toMatchObject({ statusCode: 403, code: 'auth_forbidden' });
  });

  it('usuário inativo é barrado mesmo sendo admin', async () => {
    const middleware = createRequireRole(
      'admin',
      makeAuthRepoMock(makeUser({ role: 'admin', is_active: false })),
    );
    const { error } = await run(middleware, makeAuthedReq());
    expect(error).toMatchObject({ statusCode: 403, code: 'auth_user_inactive' });
  });

  it('usuário do JWT sem linha em public.users é barrado', async () => {
    const middleware = createRequireRole('admin', makeAuthRepoMock(null));
    const { error } = await run(middleware, makeAuthedReq());
    expect(error).toMatchObject({ statusCode: 403, code: 'auth_user_inactive' });
  });

  it('sem requireAuth antes (req.auth vazio) responde 401', async () => {
    const middleware = createRequireRole('admin', makeAuthRepoMock(makeUser()));
    const { error } = await run(middleware, makeReq());
    expect(error).toMatchObject({ statusCode: 401, code: 'auth_missing_token' });
  });
});
