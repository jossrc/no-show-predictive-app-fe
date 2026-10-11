/** Identidad técnica del modelo: versión y hash corto, en tipografía monoespaciada discreta. */
export function ModelVersionNote({
  modelVersion,
  modelHash,
}: {
  modelVersion: string;
  modelHash: string;
}) {
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      Versión <code className="font-mono break-all text-foreground/80">{modelVersion}</code>
      <span aria-hidden="true"> · </span>
      <span className="sr-only">, </span>
      hash <code className="font-mono text-foreground/80">{modelHash}</code>
    </p>
  );
}
