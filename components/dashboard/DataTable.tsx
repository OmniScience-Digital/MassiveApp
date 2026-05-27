import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData extends object> {
  title: string;
  data: TData[];
  columns: ColumnDef<TData, any>[];
  pageSize?: number;
  storageKey?: string;
  searchColumn?: string;
}

export function DataTable<TData extends object>({
  title,
  data,
  columns,
  pageSize = 10,
  storageKey,
  searchColumn = "sitename",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  const [pagination, setPagination] = React.useState(() => {
    // Initialise from localStorage synchronously on first render (client only)
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { pageIndex: parsed.pageIndex || 0, pageSize };
        }
      } catch {
        // ignore
      }
    }
    return { pageIndex: 0, pageSize };
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist page index whenever it changes (but not pageSize — that's controlled by prop)
  React.useEffect(() => {
    if (isMounted && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({ pageIndex: pagination.pageIndex }));
    }
  }, [pagination.pageIndex, storageKey, isMounted]);

  const memoData = React.useMemo(() => data, [data]);
  const memoColumns = React.useMemo(() => columns, [columns]);

  const table = useReactTable({
    data: memoData,
    columns: memoColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination },
    autoResetPageIndex: false,
  });

  // Reset to page 0 only when the search filter value actually changes
  const prevFilterRef = React.useRef<ColumnFiltersState>([]);
  React.useEffect(() => {
    if (!isMounted) return;
    const prev = JSON.stringify(prevFilterRef.current);
    const next = JSON.stringify(columnFilters);
    if (prev !== next) {
      table.setPageIndex(0);
      prevFilterRef.current = columnFilters;
    }
  }, [columnFilters, isMounted]); // intentionally omit table

  const searchValue =
    (table.getColumn(searchColumn)?.getFilterValue() as string) ?? "";

  const skeleton = (
    <div className="bg-background text-foreground p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="flex items-center py-4">
        <Input placeholder={`Search ${searchColumn}`} className="max-w-sm" value="" onChange={() => {}} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {typeof h.column.columnDef.header === "function"
                      ? h.column.columnDef.header(h.getContext())
                      : h.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (!isMounted) return skeleton;

  return (
    <div className="bg-background text-foreground p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="flex items-center py-4">
        <Input
          placeholder={`Search ${searchColumn}`}
          value={searchValue}
          onChange={(e) => {
            const col = table.getColumn(searchColumn);
            if (col) col.setFilterValue(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {typeof h.column.columnDef.header === "function"
                      ? h.column.columnDef.header(h.getContext())
                      : h.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {typeof cell.column.columnDef.cell === "function"
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue()}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span className="text-3xl">🏗️</span>
                    <span>No sites yet — add your first one above.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
