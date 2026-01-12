"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Edit, Save, Loader2 } from "lucide-react";
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
  createRptDynamicList,
  deleteDynamicList,
} from "@/service/dynamiInpuList.Service";
import ResponseModal from "./response";
import { DynamicInputItem, InputData, InputType } from "@/types/dynamic-inputs";


// Define the props for the InputList component
interface InputListProps {
  id?: string | number;
  initialHeaderName?: string;
  initialInputs?: InputData[];
  inputListCount: number;
  title?: string;
  setDynamicInputs: React.Dispatch<React.SetStateAction<DynamicInputItem[]>>;
  setInputListCount: React.Dispatch<React.SetStateAction<number>>;
  onUpdate?: (updatedData: DynamicInputItem) => void;
}

const InputList = ({
  id,
  initialHeaderName = "Dynamic Input List",
  initialInputs = [],
  setDynamicInputs,
  setInputListCount,
  inputListCount, title,
  onUpdate
}: InputListProps) => {
  const params = useParams();
  const siteId = decodeURIComponent(params.id as string);

  // State for Input List
  const [inputs, setInputs] = useState<InputData[]>(initialInputs);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [headerName, setHeaderName] = useState(initialHeaderName);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [loadingSave, setloadingSave] = useState(false);
  const [loadingDelete, setloadingDelete] = useState(false);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  // Sync with props when they change
  useEffect(() => {
    setInputs(initialInputs);
  }, [initialInputs]);

  useEffect(() => {
    setHeaderName(initialHeaderName);
  }, [initialHeaderName]);

  // Input List Functions
  const addInput = (type: InputType) => {
    const newInputs = [
      ...inputs,
      {
        type,
        value: "",
        label: `Field ${inputs.length + 1}`,
        isEditing: false,
      },
    ];
    setInputs(newInputs);
    setShowInputDialog(false);

    // Notify parent
    if (onUpdate) {
      onUpdate({
        id,
        inputListName: headerName,
        inputs: newInputs
      });
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index].value = value;
    setInputs(newInputs);

    // Notify parent
    if (onUpdate) {
      onUpdate({
        id,
        inputListName: headerName,
        inputs: newInputs
      });
    }
  };

  const handleLabelChange = (index: number, label: string) => {
    const newInputs = [...inputs];
    newInputs[index].label = label;
    setInputs(newInputs);

    // Notify parent
    if (onUpdate) {
      onUpdate({
        id,
        inputListName: headerName,
        inputs: newInputs
      });
    }
  };

  const toggleEdit = (index: number) => {
    const newInputs = [...inputs];
    newInputs[index].isEditing = !newInputs[index].isEditing;
    setInputs(newInputs);
  };

const deleteInput = (index: number) => {
  const newInputs = inputs.filter((_, i) => i !== index);
  setInputs(newInputs);

  // Notify parent immediately
  if (onUpdate) {
    onUpdate({
      id,
      inputListName: headerName,
      inputs: newInputs
    });
  }


};

  // Header Functions
  const handleHeaderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setHeaderName(newName);

    // Notify parent
    if (onUpdate) {
      onUpdate({
        id,
        inputListName: newName,
        inputs: inputs
      });
    }
  };

  const toggleEditHeader = () => {
    setIsEditingHeader(!isEditingHeader);
  };

  // Save Function
  const handleSave = async () => {
    try {
      setloadingSave(true);

      const structuredData = {
        id: id || Date.now(),
        inputListName: headerName,
        inputs: inputs
      };
      let newInput: any;


      if (title === "rpt") {
        newInput = await createRptDynamicList(siteId, structuredData);

      }
      else {
        newInput = await createDynamicList(siteId, structuredData);

      }

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

      // Notify parent with the saved data
      if (onUpdate) {
        onUpdate(structuredData);
      }

      setloadingSave(false);
    } catch (error) {
      console.log(error);
      setSuccessful(false);
      setloadingSave(false);
      setMessage("Failed to save input list");
      setShow(true);
    }
  };

  const handleDeleteComponent = async () => {
    try {
      setloadingDelete(true);
      const structuredData = {
        id: id,
        inputListName: headerName,
        inputs: inputs
      };

      const deleteComponent = await deleteDynamicList(
        siteId,
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
        {title !== "rpt" && (
          loadingDelete ? (
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
              <Trash className="h-4 w-4 mr-2" /> Delete
            </Button>
          )
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