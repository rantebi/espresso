import React, { useRef, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import './DataTable.css';

export interface Column<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  getRowKey: (row: T, index: number) => string | number;
  className?: string;
}

function DataTable<T extends Record<string, any>>({
  title,
  columns,
  rows,
  loading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = 'No data found',
  getRowKey,
  className = '',
}: DataTableProps<T>) {
  const observer = useRef<IntersectionObserver | null>(null);

  // Convert our Column format to TanStack Table's ColumnDef format
  const columnDefs = useMemo<ColumnDef<T, any>[]>(
    () =>
      columns.map((col) => ({
        id: String(col.key),
        accessorKey: typeof col.key === 'string' ? col.key : String(col.key),
        header: typeof col.header === 'string' ? col.header : () => col.header,
        cell: ({ row, getValue }) => {
          const value = getValue();
          return col.render ? col.render(value, row.original) : String(value ?? '');
        },
        meta: {
          className: col.className,
        } as { className?: string },
      })),
    [columns]
  );

  // Create TanStack Table instance
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => String(getRowKey(row, index)),
  });

  const lastRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading || !hasMore || !onLoadMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  return (
    <div className={`data-table-container ${className}`}>
      {title && <h2>{title}</h2>}
      {rows.length === 0 && !loading ? (
        <p className="data-table-empty">{emptyMessage}</p>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <th
                        key={header.id}
                        className={meta?.className || ''}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => {
                const isLastRow = index === rows.length - 1;
                return (
                  <tr
                    key={row.id}
                    ref={isLastRow && hasMore && onLoadMore ? lastRowRef : null}
                    className={isLastRow && hasMore ? 'data-table-last-row' : ''}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                      return (
                        <td key={cell.id} className={meta?.className || ''}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && (
            <div className="data-table-loading">
              <p>Loading more...</p>
            </div>
          )}
          {!hasMore && !loading && rows.length > 0 && (
            <div className="data-table-end">
              <p>No more items to load.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
