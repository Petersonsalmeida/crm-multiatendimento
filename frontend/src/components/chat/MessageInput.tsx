import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/shared/Button';

export interface MessageInputProps {
  onSend: (text: string) => void;
  isSending: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  isSending,
  error,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !isSending && !disabled;

  function submit(): void {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submit();
  }

  // Enter envia, Shift+Enter quebra linha — convenção de app de chat.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border-subtle bg-bg-surface p-3"
    >
      {error && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          rows={1}
          maxLength={4096}
          placeholder="Escreva uma mensagem"
          aria-label="Mensagem"
          className="max-h-32 min-h-[40px] flex-1 resize-y rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle disabled:opacity-50"
        />
        <Button type="submit" disabled={!canSend} isLoading={isSending}>
          Enviar
        </Button>
      </div>
    </form>
  );
}
