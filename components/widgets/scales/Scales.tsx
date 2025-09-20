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
import {
  createTelegramScale,
  updateTelegramScale,
  deleteTelegramScale,
} from "@/service/scales.Service";

interface ScaleRow {
  id?: string;
  scalename: string;
  iccid: string;
  openingScaletons: string;
  [key: string]: string | undefined;
}

interface SharedTableProps {
  title: string[];
  scales: ScaleRow[];
  fetchData: () => void;
}

const SharedTable = ({ title, scales, fetchData }: SharedTableProps) => {
  const { id } = useParams<{ id: string }>();

  const [rows, setRows] = useState<ScaleRow[]>(scales);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ScaleRow | null>(null);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const [loadingRows, setLoadingRows] = useState<{ [key: number]: boolean }>(
    {},
  );

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const initialRowState: ScaleRow = {
    scalename: "",
    iccid: "",
    openingScaletons: "",
    ...Object.fromEntries(title.map((columnName) => [columnName, ""])),
  };

  const handleChange =
    (idx: number, columnName: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const updatedRows = [...rows];
      updatedRows[idx] = {
        ...updatedRows[idx],
        [columnName]: value,
      };
      setRows(updatedRows);
    };

  const handleAddRow = () => {
    const newItem: ScaleRow = {
      ...initialRowState,
      id: new Date().getTime().toString(),
    };
    setRows([...rows, newItem]);
  };

  const handleRemoveSpecificRow = (row: ScaleRow, idx: number) => {
    setRowToDelete(row);
    setIndexToDelete(idx);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (indexToDelete === null || !rowToDelete) return;

    const updatedRows = [...rows];
    updatedRows.splice(indexToDelete, 1);
    setRows(updatedRows);

    try {
      await deleteTelegramScale(id as string, rowToDelete);
      setShow(true);
      setSuccessful(true);
      setMessage("Scale deleted successfully");
      fetchData();

      // onScaleupdate();
    } catch (error) {
      setShow(true);
      setSuccessful(false);
      setMessage("Failed to  delete scale");
    } finally {
      setConfirmDialogOpen(false);
      setRowToDelete(null);
      setIndexToDelete(null);
    }
  };

  const handleSaveRow = async (row: ScaleRow, rowIndex: number) => {
    // Set loading state for the specific row
    setLoadingRows((prev) => ({ ...prev, [rowIndex]: true }));

    const exists = scales.some((scale) => scale.scalename === row.scalename);

    try {
      if (!exists) {
        if (row.scalename && row.iccid) {
          const createScale = await createTelegramScale(id as string, {
            scalename: row.scalename,
            iccid: row.iccid,
            openingScaletons: row.openingScaletons,
          });

          if (createScale) {
            setShow(true);
            setSuccessful(true);
            setMessage("Scale created successfully");
            fetchData();
          } else {
            setSuccessful(false);
            setMessage("Failed to create scale");
            setShow(true);
          }
        }
      } else {
        // If the row has an id, it's an existing row
        const updatedRows = [...rows];
        updatedRows[rowIndex] = row;
        setRows(updatedRows);

        await updateTelegramScale(id as string, {
          scalename: row.scalename,
          iccid: row.iccid,
          openingScaletons: row.openingScaletons,
        });

        setShow(true);
        setSuccessful(true);
        setMessage("Scale updated successfully");
        fetchData();
      }
    } catch (error) {
      setShow(true);
      setSuccessful(true);
      setMessage("Failed to save scale");
    } finally {
      // Reset loading state for that row
      setLoadingRows((prev) => ({ ...prev, [rowIndex]: false }));
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

      <Button onClick={handleAddRow} className="float-right m-2">
        <Plus className="mr-2 h-4 w-4" />
        Add Scales
      </Button>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              {title.map((columnName, index) => (
                <TableHead key={index}>{columnName}</TableHead>
              ))}
              <TableHead>Delete</TableHead>
              <TableHead>Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.scalename}
                    onChange={handleChange(index, "scalename")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.iccid}
                    onChange={handleChange(index, "iccid")}
                  />
                </TableCell>

                <TableCell>
                  <Input
                    type="text"
                    value={row.openingScaletons}
                    onChange={handleChange(index, "openingScaletons")}
                  />
                </TableCell>

                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveSpecificRow(row, index)}
                    className="text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </TableCell>
                <TableCell>
                  {loadingRows[index] ? (
                    <Button disabled>
                      <Loader2 className="animate-spin" />
                      Please wait
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleSaveRow(row, index)}
                      className="text-green-500"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  )}
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
              Are you sure you want to delete this row? Make Sure scale is not
              selected as a primary scale !!
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
