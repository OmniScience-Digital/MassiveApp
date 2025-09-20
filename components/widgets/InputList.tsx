"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Edit, Save, Loader2 } from "lucide-react"; // Icons from shadcn/ui
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createDynamicList,
  deleteDynamicList,
} from "@/service/dynamiInpuList.Service";
import ResponseModal from "./response";
import { ReportItem } from "@/types/schema";

// Define the InputType and InputData types
type InputType = "text" | "number" | "date" | "datetime-local";

interface InputData {
  type: InputType;
  value: string;
  label: string;
  isEditing: boolean;
}

// Define the props for the InputList component
interface InputListProps {
  initialHeaderName?: string;
  initialInputs?: InputData[];
  inputListCount: number;
  setDynamicInputs: React.Dispatch<
    React.SetStateAction<ReportItem["dynamic_inputs"]>
  >;
  setInputListCount: React.Dispatch<React.SetStateAction<number>>;
}

const InputList = ({
  initialHeaderName = "Dynamic Input List",
  initialInputs = [],
  setDynamicInputs,
  setInputListCount,
  inputListCount,
}: InputListProps) => {
  const params = useParams();

  const id = decodeURIComponent(params.id as string);
  // State for Input List
  const [inputs, setInputs] = useState<InputData[]>(initialInputs);
  const [showInputDialog, setShowInputDialog] = useState(false);

  // State for Header
  const [headerName, setHeaderName] = useState(initialHeaderName);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  const [loadingSave, setloadingSave] = useState(false);
  const [loadingDelete, setloadingDelete] = useState(false);

  //error
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  // Input List Functions
  const addInput = (type: InputType) => {
    setInputs([
      ...inputs,
      {
        type,
        value: "",
        label: `Field ${inputs.length + 1}`,
        isEditing: false,
      },
    ]);
    setShowInputDialog(false);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index].value = value;
    setInputs(newInputs);
  };

  const handleLabelChange = (index: number, label: string) => {
    const newInputs = [...inputs];
    newInputs[index].label = label;
    setInputs(newInputs);
  };

  const toggleEdit = (index: number) => {
    const newInputs = [...inputs];
    newInputs[index].isEditing = !newInputs[index].isEditing;
    setInputs(newInputs);
  };

  const deleteInput = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  // Header Functions
  const handleHeaderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderName(e.target.value);
  };

  const toggleEditHeader = () => {
    setIsEditingHeader(!isEditingHeader);
  };

  // Save Function
  const handleSave = async () => {
    try {
      setloadingSave(true);

      const structuredData = {
        inputListName: headerName,
        inputs: inputs.filter(
          (input) =>
            input.type === "text" ||
            input.type === "number" ||
            input.type === "date",
        ),
      };

      const newInput = await createDynamicList(id as string, structuredData);

      if (newInput === "rename") {
        setSuccessful(false);
        setMessage("Rename your input header name");
        setShow(true);
      } else if (newInput === "updated") {
        setSuccessful(true);
        setMessage("Input list updated");
        setShow(true);
      } else if (newInput) {
        setSuccessful(true);
        setMessage("Dynamic Input created successfully");
        setShow(true);
      }
      setloadingSave(false);
    } catch (error) {
      console.log(error);
      setSuccessful(false);
      setloadingSave(false);
      setMessage("Failed to add input header");
      setShow(true);
    }
  };

  const handleDeleteComponent = async () => {
    try {
      setloadingDelete(true);
      const structuredData = {
        inputListName: headerName,
        inputs: inputs.filter(
          (input) =>
            input.type === "text" ||
            input.type === "number" ||
            input.type === "date",
        ),
      };

      const deleteComponent = await deleteDynamicList(
        id as string,
        structuredData,
      );

      //deleting an unsave component
      if (deleteComponent === -1) {
        if (inputListCount > 0) {
          const newListCount = inputListCount - 1;
          setInputListCount(newListCount - 1);
        } else {
          setInputListCount(0);
        }
      } else {
        //updating database
        if (inputListCount > 0) {
          const newListCount = inputListCount - 1;
          setInputListCount(newListCount - 1);
        }
        setDynamicInputs(deleteComponent);
      }

      setloadingDelete(false);

      // Show success message
      setMessage("Component deleted successfully");
      setSuccessful(true);
      setShow(true);
    } catch (error) {
      setloadingDelete(false);
      console.error("Failed to delete component:", error);
      setSuccessful(false);
      setMessage("Failed to delete component");
      setShow(true);
    }
  };

  return (
    <div className="px-6 py-2 border h-full w-full rounded-lg shadow-sm bg-background space-y-4">
      {/* Editable Header */}
      <div className="flex items-center justify-between">
        {isEditingHeader ? (
          <Input
            type="text"
            value={headerName}
            onChange={handleHeaderNameChange}
            onBlur={toggleEditHeader}
            autoFocus
            className="w-2/3"
          />
        ) : (
          <h2
            className="text-xm font-medium uppercase tracking-wide text-foreground"
            onClick={toggleEditHeader}
          >
            {headerName}
          </h2>
        )}
        <Button variant="ghost" size="icon" onClick={toggleEditHeader}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {/* Input List Section */}
      <div className="space-y-4">
        <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="mb-4">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Input Field</DialogTitle>
              <DialogDescription>
                Please select available inputs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button onClick={() => addInput("text")}>Text</Button>
              <Button onClick={() => addInput("number")}>Number</Button>
              <Button onClick={() => addInput("date")}>Date</Button>
              <Button onClick={() => addInput("datetime-local")}>
                DateTime
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Separator />

        {inputs.map((input, index) => (
          <div key={index} className="flex flex-wrap items-center ">
            <div className="flex-1 flex flex-wrap items-center ">
              {input.isEditing ? (
                <Input
                  type="text"
                  value={input.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  placeholder="Label"
                  className="w-full"
                />
              ) : (
                <span className="w-full  text-sm font-medium">
                  {input.label}
                </span>
              )}

              {input.isEditing ? (
                <Input
                  type={input.type}
                  value={input.value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={`Enter ${input.type}`}
                  className="w-full sm:w-2/3"
                />
              ) : (
                <Input
                  type={input.type}
                  value={input.value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={`Enter ${input.type}`}
                  className="w-full sm:w-2/3"
                  disabled={!input.isEditing}
                />
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleEdit(index)}
            >
              {input.isEditing ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteInput(index)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
            <Separator className="my-1" />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        {loadingDelete ? (
          <Button className="mr-2" disabled>
            <Loader2 className="animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button
            onClick={handleDeleteComponent}
            variant="destructive"
            className="mx-3"
          >
            <Trash className="h-4 w-4 mr-2 " /> Delete
          </Button>
        )}

        {loadingSave ? (
          <Button className="mr-2" disabled>
            <Loader2 className="animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2 " /> Save
          </Button>
        )}
      </div>
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

export default InputList;
