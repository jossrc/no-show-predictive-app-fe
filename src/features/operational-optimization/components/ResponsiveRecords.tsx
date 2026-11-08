import type { ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface RecordColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Celda principal: en tarjetas se muestra como título, sin etiqueta. */
  primary?: boolean;
  className?: string;
}

interface Props<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: RecordColumn<T>[];
  /** Acciones por fila (detalle, registro…): última columna en tabla, pie en tarjetas. */
  actions?: (row: T) => ReactNode;
  caption: string;
}

/**
 * Registros en tabla semántica (escritorio) o tarjetas de una/dos columnas (móvil y tablet),
 * con los mismos datos y sin desplazamiento horizontal. La paginación la hace el servidor.
 */
export function ResponsiveRecords<T>({ rows, rowKey, columns, actions, caption }: Props<T>) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader className="bg-surface-subtle">
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead key={column.key} className={cn(index === 0 && 'pl-5')}>
                  {column.header}
                </TableHead>
              ))}
              {actions && (
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.key}
                    className={cn('whitespace-normal', index === 0 && 'pl-5', column.className)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="pr-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {actions(row)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="-mb-px grid sm:grid-cols-2 lg:hidden" aria-label={caption}>
        {rows.map((row) => (
          <RecordCard key={rowKey(row)} row={row} columns={columns} actions={actions} />
        ))}
      </ul>
    </>
  );
}

function RecordCard<T>({
  row,
  columns,
  actions,
}: Pick<Props<T>, 'columns' | 'actions'> & { row: T }) {
  const primary = columns.find((column) => column.primary);
  return (
    <li className="flex flex-col gap-2.5 border-b px-4 py-4 sm:px-5 sm:odd:border-r">
      {primary && <div className="font-medium break-all tabular-nums">{primary.cell(row)}</div>}
      <dl className="space-y-1.5 text-[13px]">
        {columns
          .filter((column) => !column.primary)
          .map((column) => (
            <div key={column.key} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{column.header}</dt>
              <dd className="min-w-0 text-right break-words">{column.cell(row)}</dd>
            </div>
          ))}
      </dl>
      {actions && (
        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
          {actions(row)}
        </div>
      )}
    </li>
  );
}
