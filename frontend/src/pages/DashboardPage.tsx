import { Link } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-whatsapp-primary/20 ring-1 ring-whatsapp-primary/40" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">AliançaCRM</h1>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border-subtle bg-bg-surface p-12 text-center">
          <div>
            <h2 className="text-lg font-medium">Dashboard</h2>
            <p className="text-sm text-text-muted">
              Métricas, funil e visão geral chegam nas próximas fases.
            </p>
          </div>
          <Link to="/chat">
            <Button>Abrir atendimento</Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
