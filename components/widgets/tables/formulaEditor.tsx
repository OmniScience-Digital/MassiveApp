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
import { isShownInHourly, isShownInProgressive } from "@/lib/formulaPlacement";

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

  // Toggle one checkbox column (virtual / hourly / progressive) and save straight away
  const handleFlagToggle = async (
    formula: ReportItem["formulas"][0],
    field: "virtualformula" | "showInHourly" | "showInProgressive",
  ) => {
    try {
      const currentStatus =
        field === "virtualformula"
          ? (formula.virtualformula ?? false)
          : field === "showInHourly"
            ? isShownInHourly({ ...formula, virtualformula: false })
            : isShownInProgressive({ ...formula, virtualformula: false });
      const updatedStatus = !currentStatus;

      // Optimistically update local state first
      setFormulas((prevFormulas) =>
        prevFormulas.map((f) =>
          f.formulaname === formula.formulaname
            ? { ...f, [field]: updatedStatus }
            : f,
        ),
      );

      const updatedFormula = { ...formula, [field]: updatedStatus };

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

      const labels = {
        virtualformula: updatedStatus
          ? "Formula marked as virtual"
          : "Formula marked as regular",
        showInHourly: updatedStatus
          ? "Formula will show in the hourly report"
          : "Formula removed from the hourly report",
        showInProgressive: updatedStatus
          ? "Formula will show in the progressive report"
          : "Formula removed from the progressive report",
      };
      setSuccessful(true);
      setMessage(`${labels[field]} successfully`);
      setShow(true);
    } catch (error) {
      console.error("Error toggling formula flag:", error);
      setSuccessful(false);
      setMessage("Failed to update formula");
      setShow(true);
    }
  };

  const handleCreate = () => {
    setEditingFormula({
      formulaname: "",
      formula: "",
      virtualformula: false,
      minKpi: "",
      maxKpi: "",
      showInHourly: false,
      showInProgressive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!editingFormula?.formulaname || !editingFormula.formula) {
        setIsDialogOpen(false);
        setFormulas(initialFormulas);
        setSuccessful(false);
        setMessage("Missing formula attributes");
        setShow(true);

        return;
      }

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
            <TableHead>Min KPI</TableHead>
            <TableHead>Max KPI</TableHead>
            <TableHead>VS</TableHead>
            <TableHead>Hourly</TableHead>
            <TableHead>Progressive</TableHead>
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
              <TableCell className="font-mono">{formula.minKpi || "-"}</TableCell>
              <TableCell className="font-mono">{formula.maxKpi || "-"}</TableCell>
              <TableCell className="font-mono">
                <Checkbox
                  id={`formula-${formula.formulaname}`}
                  checked={formula.virtualformula}
                  onCheckedChange={() => handleFlagToggle(formula, "virtualformula")}
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  id={`hourly-${formula.formulaname}`}
                  checked={isShownInHourly(formula)}
                  disabled={formula.virtualformula}
                  title={
                    formula.virtualformula
                      ? "Virtual formulas are never printed"
                      : undefined
                  }
                  onCheckedChange={() =>
                    handleFlagToggle(formula, "showInHourly")
                  }
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  id={`progressive-${formula.formulaname}`}
                  checked={isShownInProgressive(formula)}
                  disabled={formula.virtualformula}
                  title={
                    formula.virtualformula
                      ? "Virtual formulas are never printed"
                      : undefined
                  }
                  onCheckedChange={() =>
                    handleFlagToggle(formula, "showInProgressive")
                  }
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min KPI
                </label>
                <input
                  type="text"
                  value={editingFormula?.minKpi || ""}
                  onChange={(e) =>
                    setEditingFormula((prev) =>
                      prev ? { ...prev, minKpi: e.target.value } : null,
                    )
                  }
                  placeholder="e.g. 80"
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max KPI
                </label>
                <input
                  type="text"
                  value={editingFormula?.maxKpi || ""}
                  onChange={(e) =>
                    setEditingFormula((prev) =>
                      prev ? { ...prev, maxKpi: e.target.value } : null,
                    )
                  }
                  placeholder="e.g. 100"
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Show in report
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={
                      editingFormula ? isShownInHourly(editingFormula) : false
                    }
                    disabled={editingFormula?.virtualformula}
                    onCheckedChange={(checked) =>
                      setEditingFormula((prev) =>
                        prev ? { ...prev, showInHourly: checked === true } : null,
                      )
                    }
                  />
                  Hourly
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={
                      editingFormula ? isShownInProgressive(editingFormula) : true
                    }
                    disabled={editingFormula?.virtualformula}
                    onCheckedChange={(checked) =>
                      setEditingFormula((prev) =>
                        prev
                          ? { ...prev, showInProgressive: checked === true }
                          : null,
                      )
                    }
                  />
                  Progressive
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Formular</label>
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
                {scales.map((scale, index) => (
                  <Button
                    key={`${scale.iccid}-${index}`}
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