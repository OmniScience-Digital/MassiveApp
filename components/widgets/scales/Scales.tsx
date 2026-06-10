import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
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
import { ReportItem } from "@/types/schema";

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
}

interface SharedTableProps {
  title: string[];
  scales: ScaleRow[];
  onUpdate?: (scales: ReportItem["scales"]) => void;
}

const SharedTable = ({ scales, onUpdate }: SharedTableProps) => {
  const { id } = useParams<{ id: string }>();

  const [rows, setRows] = useState<ScaleRow[]>(scales);
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());
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
  });

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
      const result = await saveAllScales(id as string, payload);
      if (result) {
        setDirtyRows(new Set());
        onUpdate?.(payload);
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
          {dirtyRows.size > 0 && (
            <span className="text-xs text-amber-500">
              {dirtyRows.size} unsaved change{dirtyRows.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            disabled={saving || dirtyRows.size === 0}
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
              <TableHead>Scale Name</TableHead>
              <TableHead>ICCID</TableHead>
              <TableHead>Device Address</TableHead>
              <TableHead>Totalizer</TableHead>
              <TableHead>Month Tons</TableHead>
              <TableHead>Flow</TableHead>
              <TableHead>Opening MTD</TableHead>
              <TableHead className="w-20 text-center">PLC</TableHead>
              <TableHead className="w-24">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
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
                <TableCell>
                  <Input
                    type="text"
                    value={row.scalename}
                    onChange={handleChange(index, "scalename")}
                    placeholder="Scale name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.iccid}
                    onChange={handleChange(index, "iccid")}
                    placeholder="ICCID"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground select-none whitespace-nowrap">
                      modbus-
                    </span>
                    <Input
                      type="text"
                      value={row.deviceAddress?.replace(/^modbus-/, "") ?? ""}
                      onChange={handleDeviceAddressChange(index)}
                      className="w-24"
                      placeholder="address"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.totalizer ?? ""}
                    onChange={handleChange(index, "totalizer")}
                    className="w-28"
                    placeholder="Totalizer"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.monthTons ?? ""}
                    onChange={handleChange(index, "monthTons")}
                    className="w-28"
                    placeholder="Month tons"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.flow ?? ""}
                    onChange={handleChange(index, "flow")}
                    className="w-24"
                    placeholder="Flow"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.openingScaletons}
                    onChange={handleChange(index, "openingScaletons")}
                    className="w-28"
                    placeholder="Opening MTD"
                  />
                </TableCell>
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
