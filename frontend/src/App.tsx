import { Button } from '@/components/shared/Button';

export default function App() {
  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-8 px-6 py-16">
        <header className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-whatsapp-primary/20 ring-1 ring-whatsapp-primary/40" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AliançaCRM</h1>
            <p className="text-sm text-text-muted">
              Scaffold Fase 1 — Fundação · tema dark + WhatsApp
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-6">
          <h2 className="text-lg font-medium">Button — referência de padrão</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Enviar mensagem</Button>
            <Button variant="secondary">Transferir</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger">Finalizar</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeno</Button>
            <Button size="md">Médio</Button>
            <Button size="lg">Grande</Button>
            <Button isLoading>Enviando…</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </section>
      </div>
    </main>
  );
}
