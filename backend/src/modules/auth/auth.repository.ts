import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/shared/supabase';
import type { AuthUserRow } from '@/modules/auth/auth.types';

const TABLE = 'users';

export interface AuthRepository {
  findUserById(id: string): Promise<AuthUserRow | null>;
}

export function createAuthRepository(
  client: SupabaseClient = getSupabaseAdmin(),
): AuthRepository {
  return {
    async findUserById(id) {
      const { data, error } = await client
        .from(TABLE)
        .select('id, email, full_name, role, is_active')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as AuthUserRow | null) ?? null;
    },
  };
}
