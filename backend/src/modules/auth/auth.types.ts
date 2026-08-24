import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'agente']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Identidade extraída do JWT do Supabase (sem ida ao banco).
export interface AuthContext {
  userId: string;
  email?: string;
}

// Linha de public.users usada pela autorização por role.
export interface AuthUserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      authUser?: AuthUserRow;
    }
  }
}
