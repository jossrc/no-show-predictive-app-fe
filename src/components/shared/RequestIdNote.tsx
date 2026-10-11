/** Identificador de solicitud para soporte; discreto y seleccionable. */
export function RequestIdNote({ requestId }: { requestId: string | null }) {
  if (!requestId) return null;
  return (
    <p className="text-[11px] text-muted-foreground">
      ID de solicitud:{' '}
      <code className="font-mono break-all text-foreground/80 select-all">{requestId}</code>
    </p>
  );
}
