import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  setSession: (session) =>
    set({
      session,
      status: session ? 'authenticated' : 'unauthenticated',
    }),
}));

// Selectors — funções puras, não acoplam componentes ao shape interno.
export const selectAuthStatus = (state: AuthState): AuthStatus => state.status;
export const selectUser = (state: AuthState): User | null =>
  state.session?.user ?? null;
