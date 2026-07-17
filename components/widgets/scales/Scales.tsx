import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Save, Columns3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ResponseModal from "../response";
import { saveAllScales, deleteTelegramScale } from "@/service/scales.Service";
import { ReportItem, ScaleColumnConfig } from "@/types/schema";

interface ScaleRow {
  id?: string;
  scalename: string;
  iccid: string;
  deviceAddress: string;
  totalizer: string;
  monthTons: string;
  flow: string;
  openingScaletons: string;
  isPlc?: boolean;
  customFields?: { [key: string]: string };
}

interface SharedTableProps {
  title: string[];
  scales: ScaleRow[];
  columns?: ScaleColumnConfig[];
  onUpdate?: (scales: ReportItem["scales"]) => void;
  onColumnsUpdate?: (columns: ScaleColumnConfig[]) => void;
}

// Fixed column widths (px). ICCID is reduced 40% off its base width (220 -> 132);
// every other data column is reduced 50% off its base width.
const FIXED_COLUMNS: { key: keyof ScaleRow; label: string; width: number }[] = [
  { key: "scalename", label: "Scale Name", width: 50 }, // base 160, -50%
  { key: "iccid", label: "ICCID", width: 80 }, // base 220, -40%
  { key: "deviceAddress", label: "Device Address", width: 20 }, // base 140, -50%
  { key: "totalizer", label: "Totalizer", width: 20 }, // base 140, -50%
  { key: "monthTons", label: "Month Tons", width: 20 }, // base 140, -50%
  { key: "flow", label: "Flow", width: 20 }, // base 120, -50%
  { key: "openingScaletons", label: "Opening MTD", width: 30 }, // base 140, -50%
];

const CUSTOM_COLUMN_WIDTH = 100;

const SharedTable = ({
  scales,
  columns,
  onUpdate,
  onColumnsUpdate,
}: SharedTableProps) => {
  const { id } = useParams<{ id: string }>();

  const [rows, setRows] = useState<ScaleRow[]>(scales);
  const [customColumns, setCustomColumns] = useState<ScaleColumnConfig[]>(
    columns ?? [],
  );
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
  const [columnsDirty, setColumnsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ScaleRow | null>(null);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const blankRow = (): ScaleRow => ({
    id: Date.now().toString(),
    scalename: "",
    iccid: "",
    deviceAddress: "",
    totalizer: "",
    monthTons: "",
    flow: "",
    openingScaletons: "",
    isPlc: false,
    customFields: Object.fromEntries(customColumns.map((c) => [c.key, ""])),
  });

  const handleAddColumn = () => {
    const newColumn: ScaleColumnConfig = {
      key: `custom_${Date.now()}`,
      label: `Custom ${customColumns.length + 1}`,
    };
    setCustomColumns((prev) => [...prev, newColumn]);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        customFields: { ...r.customFields, [newColumn.key]: "" },
      })),
    );
    setColumnsDirty(true);
  };

  const handleRenameColumn = (key: string, label: string) => {
    setCustomColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, label } : c)),
    );
    setColumnsDirty(true);
  };

  const handleDeleteColumn = (key: string) => {
    setCustomColumns((prev) => prev.filter((c) => c.key !== key));
    setRows((prev) =>
      prev.map((r) => {
        const { [key]: _removed, ...rest } = r.customFields ?? {};
        return { ...r, customFields: rest };
      }),
    );
    setColumnsDirty(true);
  };

  const handleCustomFieldChange =
    (idx: number, key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          customFields: {
            ...updated[idx].customFields,
            [key]: e.target.value,
          },
        };
        return updated;
      });
      setDirtyRows((prev) => new Set(prev).add(idx));
    };

  const handleChange =
    (idx: number, field: keyof ScaleRow) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: e.target.value };
        return updated;
      });
      setDirtyRows((prev) => new Set(prev).add(idx));
    };

  const handleDeviceAddressChange =
    (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          deviceAddress: `modbus-${e.target.value}`,
        };
        return updated;
      });
      setDirtyRows((prev) => new Set(prev).add(idx));
    };

  const handlePlcToggle = (idx: number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], isPlc: !updated[idx].isPlc };
      return updated;
    });
    setDirtyRows((prev) => new Set(prev).add(idx));
  };

  const handleAddRow = () => {
    const newRow = blankRow();
    setRows((prev) => [...prev, newRow]);
    setDirtyRows((prev) => new Set(prev).add(rows.length));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = rows.map(({ id: _id, ...rest }) => rest);
      const result = await saveAllScales(id as string, payload, customColumns);
      if (result) {
        setDirtyRows(new Set());
        setColumnsDirty(false);
        onUpdate?.(payload);
        onColumnsUpdate?.(customColumns);
        setSuccessful(true);
        setMessage("All scales saved successfully");
      } else {
        setSuccessful(false);
        setMessage("Failed to save scales");
      }
    } catch {
      setSuccessful(false);
      setMessage("Unexpected error saving scales");
    } finally {
      setSaving(false);
      setShow(true);
    }
  };

  const handleRemoveSpecificRow = (row: ScaleRow, idx: number) => {
    setRowToDelete(row);
    setIndexToDelete(idx);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (indexToDelete === null || !rowToDelete) return;

    const updatedRows = rows.filter((_, i) => i !== indexToDelete);
    setRows(updatedRows);
    setDirtyRows((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < indexToDelete) next.add(i);
        else if (i > indexToDelete) next.add(i - 1);
      });
      return next;
    });

    try {
      await deleteTelegramScale(id as string, rowToDelete);
      onUpdate?.(updatedRows.map(({ id: _id, ...rest }) => rest));
      setSuccessful(true);
      setMessage("Scale deleted successfully");
    } catch {
      setSuccessful(false);
      setMessage("Failed to delete scale");
    } finally {
      setShow(true);
      setConfirmDialogOpen(false);
      setRowToDelete(null);
      setIndexToDelete(null);
    }
  };

  return (
    <div className="p-2 relative">
      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {(dirtyRows.size > 0 || columnsDirty) && (
            <span className="text-xs text-amber-500">
              {dirtyRows.size > 0 &&
                `${dirtyRows.size} unsaved change${dirtyRows.size > 1 ? "s" : ""}`}
              {dirtyRows.size > 0 && columnsDirty && " · "}
              {columnsDirty && "unsaved column changes"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAddColumn}>
            <Columns3 className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          <Button variant="outline" onClick={handleAddRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add Scale
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allPlc = rows.every((r) => r.isPlc);
              setRows((prev) => prev.map((r) => ({ ...r, isPlc: !allPlc })));
              setDirtyRows(new Set(rows.map((_, i) => i)));
            }}
            disabled={rows.length === 0}
          >
            {rows.every((r) => r.isPlc) && rows.length > 0
              ? "Unmark All PLC"
              : "Mark All PLC"}
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || (dirtyRows.size === 0 && !columnsDirty)}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              {FIXED_COLUMNS.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              {customColumns.map((col) => (
                <TableHead key={col.key} style={{ width: CUSTOM_COLUMN_WIDTH }}>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={col.label}
                      onChange={(e) =>
                        handleRenameColumn(col.key, e.target.value)
                      }
                      className="h-7 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col.key)}
                      title="Remove column"
                      className="text-muted-foreground hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-20 text-center">PLC</TableHead>
              <TableHead className="w-24">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={FIXED_COLUMNS.length + customColumns.length + 3}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  No scales yet — click <strong>Add Scale</strong> to get
                  started.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, index) => (
              <TableRow
                key={row.id || index}
                className={
                  dirtyRows.has(index) ? "bg-amber-50 dark:bg-amber-950/20" : ""
                }
              >
                <TableCell className="text-muted-foreground text-sm">
                  {index + 1}
                </TableCell>
                {FIXED_COLUMNS.map((col) => (
                  <TableCell key={col.key} style={{ width: col.width }}>
                    {col.key === "deviceAddress" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground select-none whitespace-nowrap">
                          modbus-
                        </span>
                        <Input
                          type="text"
                          value={row.deviceAddress?.replace(/^modbus-/, "") ?? ""}
                          onChange={handleDeviceAddressChange(index)}
                          placeholder="address"
                        />
                      </div>
                    ) : (
                      <Input
                        type="text"
                        value={(row[col.key] as string) ?? ""}
                        onChange={handleChange(index, col.key)}
                        placeholder={col.label}
                      />
                    )}
                  </TableCell>
                ))}
                {customColumns.map((col) => (
                  <TableCell key={col.key} style={{ width: CUSTOM_COLUMN_WIDTH }}>
                    <Input
                      type="text"
                      value={row.customFields?.[col.key] ?? ""}
                      onChange={handleCustomFieldChange(index, col.key)}
                      placeholder={col.label}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <button
                    type="button"
                    onClick={() => handlePlcToggle(index)}
                    title={row.isPlc ? "PLC scale" : "Mark as PLC"}
                    className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                      row.isPlc
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    {row.isPlc && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 10 10"
                      >
                        <path
                          d="M1.5 5l2.5 2.5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSpecificRow(row, index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scale? Make sure it is not
              selected as a primary scale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SharedTable;
