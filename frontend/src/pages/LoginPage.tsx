import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signIn, isSigningIn, signInError, isAuthenticated, isLoading } =
    useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-lg bg-whatsapp-primary/20 ring-1 ring-whatsapp-primary/40" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              AliançaCRM
            </h1>
            <p className="text-sm text-text-muted">
              Entre com sua conta para continuar
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <LoginForm
            onSubmit={signIn}
            isLoading={isSigningIn}
            error={signInError}
          />
        </div>
      </div>
    </main>
  );
}
