import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  Parentheses,
  Trash2,
  Save,
  Delete,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportItem } from "@/types/schema";
import { createFormula, updateFormula } from "@/service/formulas.Service";
import ResponseModal from "../response";

interface FormulaEditorProps {
  scales: ReportItem["scales"];
  formulas: ReportItem["formulas"];
  onSave: (formula: ReportItem["formulas"][0]) => void;
  onDelete: (formula: Pick<ReportItem["formulas"][0], "formulaname">) => void;
}

export const FormulaEditor = ({
  scales,
  formulas: initialFormulas,
  onSave,
  onDelete,
}: FormulaEditorProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  const [editingFormula, setEditingFormula] = useState<
    ReportItem["formulas"][0] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customScale, setCustomScale] = useState("");
  const [formulas, setFormulas] =
    useState<ReportItem["formulas"]>(initialFormulas);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const handleEdit = (formula: ReportItem["formulas"][0]) => {
    setEditingFormula(formula);
    setIsDialogOpen(true);
  };

  //make a virtual formula
  const handleScaleToggle = async (formula: ReportItem["formulas"][0]) => {
    try {
      // Safely handle undefined virtualformula
      const currentStatus = formula.virtualformula ?? false;
      const updatedStatus = !currentStatus;

      // Optimistically update local state first
      setFormulas((prevFormulas) =>
        prevFormulas.map((f) =>
          f.formulaname === formula.formulaname
            ? { ...f, virtualformula: updatedStatus }
            : f,
        ),
      );

      // Update in database
      const updatedFormula = {
        ...formula,
        virtualformula: updatedStatus,
      };

      const newformula = await updateFormula(id as string, updatedFormula);

      if (!newformula) {
        // Revert if API fails
        setFormulas((prevFormulas) =>
          prevFormulas.map((f) =>
            f.formulaname === formula.formulaname ? formula : f,
          ),
        );
        throw new Error("Update failed");
      }

      // Update parent component if needed
      onSave(updatedFormula);

      setSuccessful(true);
      setMessage(
        `Formula marked as ${updatedStatus ? "virtual" : "regular"} successfully`,
      );
      setShow(true);
    } catch (error) {
      console.error("Error toggling virtual status:", error);
      setSuccessful(false);
      setMessage("Failed to update formula status");
      setShow(true);
    }
  };

  const handleCreate = () => {
    setEditingFormula({
      formulaname: "",
      formula: "",
      virtualformula: false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!editingFormula) return;

      // Optimistically update local state
      setFormulas((prev) => {
        const exists = prev.some(
          (f) => f.formulaname === editingFormula.formulaname,
        );
        return exists
          ? prev.map((f) =>
              f.formulaname === editingFormula.formulaname ? editingFormula : f,
            )
          : [...prev, editingFormula];
      });

      onSave(editingFormula);
      setIsDialogOpen(false);

      const exists = formulas.find(
        (f: any) => f.formulaname === editingFormula.formulaname,
      );

      let newformula;
      if (!exists) {
        newformula = await createFormula(id as string, editingFormula);

        if (newformula) {
          setSuccessful(true);
          setMessage("Formula created successfully");
          setShow(true);
        } else if (newformula === null) {
          setSuccessful(false);
          setMessage("Formula with this name already exists");
          setShow(true);
        }
      } else {
        newformula = await updateFormula(id as string, editingFormula);

        if (newformula) {
          setSuccessful(true);
          setMessage("Formula updated successfully");
          setShow(true);
        }
      }
    } catch (error) {
      console.log("Error creating formula ", error);
      // Revert state on error
      setFormulas(initialFormulas);
      setSuccessful(false);
      setMessage("Failed to update formula");
      setShow(true);
    }
  };

  const handleDelete = () => {
    if (!editingFormula?.formulaname) return;

    // Optimistically update local state
    setFormulas((prev) =>
      prev.filter((f) => f.formulaname !== editingFormula.formulaname),
    );
    onDelete({ formulaname: editingFormula.formulaname });
    setIsDialogOpen(false);
  };

  const addToFormula = (value: string) => {
    setEditingFormula((prev) =>
      prev
        ? {
            ...prev,
            formula: `${prev.formula} ${value}`,
          }
        : null,
    );
  };

  const addCustomScale = () => {
    const scaleToAdd = customScale.trim();
    if (scaleToAdd) {
      addToFormula(scaleToAdd);
      setCustomScale("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addCustomScale();
    }
  };

  return (
    <div className="px-6 py-2 border h-full w-full rounded-lg shadow-sm bg-background space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Formulas</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create Formula
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Formula Name</TableHead>
            <TableHead>Formula</TableHead>
            <TableHead>VS</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formulas.map((formula) => (
            <TableRow key={formula.formulaname}>
              <TableCell className="font-medium">
                {formula.formulaname}
              </TableCell>
              <TableCell className="font-mono">{formula.formula}</TableCell>
              <TableCell className="font-mono">
                <Checkbox
                  id={`formula-${formula.formulaname}`}
                  checked={formula.virtualformula}
                  onCheckedChange={() => handleScaleToggle(formula)}
                />
              </TableCell>

              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(formula)}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {editingFormula?.formulaname ? "Edit Formula" : "Create Formula"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Formula Name
              </label>
              <input
                type="text"
                value={editingFormula?.formulaname || ""}
                onChange={(e) =>
                  setEditingFormula((prev) =>
                    prev ? { ...prev, formulaname: e.target.value } : null,
                  )
                }
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Formulaw</label>
              <div className="p-3 border rounded bg-gray-50 min-h-12 font-mono mb-2">
                {editingFormula?.formula || (
                  <span className="text-black">
                    Formula will appear here
                  </span>
                )}
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={customScale}
                  onChange={(e) => setCustomScale(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type any scale name"
                  className="flex-1 p-2 border rounded text-black"
                />
                <Button
                  variant="outline"
                  onClick={addCustomScale}
                  disabled={!customScale.trim()}
                >
                  Add Scale
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                {scales.map((scale) => (
                  <Button
                    key={scale.iccid}
                    variant="outline"
                    onClick={() => addToFormula(scale.scalename)}
                  >
                    {scale.scalename}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => addToFormula("0")}>
                  0
                </Button>
                <Button variant="outline" onClick={() => addToFormula("1")}>
                  1
                </Button>
                <Button variant="outline" onClick={() => addToFormula("2")}>
                  2
                </Button>
                <Button variant="outline" onClick={() => addToFormula("3")}>
                  3
                </Button>
                <Button variant="outline" onClick={() => addToFormula("4")}>
                  4
                </Button>
                <Button variant="outline" onClick={() => addToFormula("5")}>
                  5
                </Button>
                <Button variant="outline" onClick={() => addToFormula("6")}>
                  6
                </Button>
                <Button variant="outline" onClick={() => addToFormula("7")}>
                  7
                </Button>
                <Button variant="outline" onClick={() => addToFormula("8")}>
                  8
                </Button>
                <Button variant="outline" onClick={() => addToFormula("9")}>
                  9
                </Button>
                <Button variant="outline" onClick={() => addToFormula("100")}>
                  100
                </Button>
                <Button variant="outline" onClick={() => addToFormula(".")}>
                  .
                </Button>
                <Button variant="outline" onClick={() => addToFormula("+")}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => addToFormula("-")}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => addToFormula("*")}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => addToFormula("/")}>
                  <Divide className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => addToFormula("(")}>
                  <Parentheses className="h-4 w-4" /> (
                </Button>
                <Button variant="outline" onClick={() => addToFormula("((")}>
                  <Parentheses className="h-4 w-4" /> ((
                </Button>
                <Button variant="outline" onClick={() => addToFormula(")")}>
                  <Parentheses className="h-4 w-4" /> )
                </Button>
                <Button variant="outline" onClick={() => addToFormula("))")}>
                  <Parentheses className="h-4 w-4" /> ))
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditingFormula((prev) =>
                      prev ? { ...prev, formula: "" } : null,
                    )
                  }
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditingFormula((prev) =>
                      prev
                        ? { ...prev, formula: prev.formula.slice(0, -1) }
                        : null,
                    )
                  }
                >
                  <Delete className="h-4 w-4" /> Back
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              {editingFormula?.formulaname && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
    </div>
  );
};
