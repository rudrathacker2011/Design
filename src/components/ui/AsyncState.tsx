import type { ReactNode } from 'react';

type AsyncStateProps = {
  status: 'loading' | 'error' | 'empty';
  title: string;
  description: string;
  action?: ReactNode;
};

export function AsyncState({ status, title, description, action }: AsyncStateProps) {
  return (
    <section className={`ys-async-state ys-async-state-${status}`} role={status === 'error' ? 'alert' : undefined}>
      <span className="ys-async-state-marker" aria-hidden="true">
        {status === 'loading' ? '…' : status === 'error' ? '!' : '—'}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {action}
      </div>
    </section>
  );
}
