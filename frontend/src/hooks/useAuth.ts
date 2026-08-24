import { useCallback, useEffect, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signInWithPassword,
  signOut as signOutService,
} from '@/services/supabase';
import {
  selectAuthStatus,
  selectUser,
  useAuthStore,
} from '@/store/authStore';

// Não segue o padrão genérico { data, isLoading, error, refetch } dos
// hooks de fetch — sessão de auth é um stream (onAuthStateChange), não
// uma leitura pontual, então o formato natural é { user, status, ... }.
export function useAuth() {
  const status = useAuthStore(selectAuthStatus);
  const user = useAuthStore(selectUser);
  const setSession = useAuthStore((state) => state.setSession);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
    return onAuthStateChange(setSession);
  }, [setSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsSigningIn(true);
      setSignInError(null);
      const { session, error } = await signInWithPassword(email, password);
      setIsSigningIn(false);

      if (error) {
        setSignInError(error.message);
        return false;
      }
      setSession(session);
      return true;
    },
    [setSession],
  );

  const signOut = useCallback(async () => {
    await signOutService();
    setSession(null);
  }, [setSession]);

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
    isSigningIn,
    signInError,
  };
}
