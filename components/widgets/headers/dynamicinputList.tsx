import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GridHeader from "../GridHeader";
import { ReportItem } from "@/types/schema";
import {
  createSiteHeaders,
  deleteSiteHeader,
} from "@/service/siteHeaders.Service";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "../deletedialog";
import ResponseModal from "../response";

interface HeadersProps{
headers: ReportItem["headers"],
  onUpdate?: (updatedConstants:  ReportItem["headers"]) => void;
}

const DynamicInputList = ({ headers ,onUpdate}: HeadersProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  // Initialize inputs with headers
  const [inputs, setInputs] = useState<ReportItem["headers"]>(headers || []);
  const [index, setIndex] = useState<number>(0);

  const [loadinbtn, setLoadingBtn] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null); // Track index to delete
  const [opendelete, setOpendelete] = useState(false); // Dialog visibility state for deleting dashboard

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], headername: value };
    setIndex(index);
    setInputs(newInputs);
  };

  const handleAddInput = () => {
    setInputs([...inputs, { headername: "" }]);
  };

const handleSave = async () => {
    try {
        const isValid = inputs[index]?.headername?.trim() !== "";

        if (isValid) {
            setLoadingBtn(true);

            // Save to backend
            await createSiteHeaders(id, {
                headername: inputs[index].headername,
            });

            // ✅ Create a NEW array with updated values
            const updatedHeaders = inputs.map((header, i) => 
                i === index 
                    ? { ...header, headername: inputs[index].headername }
                    : header
            );
            

            // ✅ Update parent with the NEW array
            if (onUpdate) {
                onUpdate(updatedHeaders);
            }
            
            setSuccessful(true);
            setMessage("Header created successfully");
            setShow(true);
        } else {
            // Handle invalid input
            const filteredHeaders = inputs.filter((_, i) => i !== index);
            setInputs(filteredHeaders);

            if (onUpdate) {
                onUpdate(filteredHeaders);
            }
            
            setSuccessful(false);
            setMessage("Invalid header name");
            setShow(true);
        }
    } catch (error) {
        setLoadingBtn(false);
        console.log(error);
    } finally {
        setLoadingBtn(false);
    }
};

  const handleRemoveInput = (index: number) => {
    setDeleteIndex(index); // Store index of item to delete
    setOpendelete(true); // Open confirmation dialog
  };

const handleDeleteConfirmation = async () => {
    if (deleteIndex !== null) {
        try {
            const headerToDelete = inputs[deleteIndex];
            
            // ✅ Create a NEW filtered array
            const updatedHeaders = inputs.filter((_, i) => i !== deleteIndex);
            
            // Update local state
            setInputs(updatedHeaders);
            
            console.log("After delete, passing to parent:", updatedHeaders);
            
            // ✅ Update parent with NEW array
            if (onUpdate) {
                onUpdate(updatedHeaders);
            }
            
            setOpendelete(false);
            
            // Delete from backend
            await deleteSiteHeader(id, { headername: headerToDelete.headername });

            setSuccessful(true);
            setMessage("Header deleted successfully");
            setShow(true);
        } catch (error) {
            console.log(error);
            setSuccessful(false);
            setMessage("Failed to delete header");
            setShow(true);
        } finally {
            setDeleteIndex(null);
        }
    }
};

  return (
    <div className="px-6 py-2 border h-full w-full rounded-lg shadow-sm bg-background space-y-4">
      <GridHeader children="Site Header" />
      {inputs.map((input, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            value={input.headername}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`Input ${index + 1}`}
            className="w-64"
          />
          <Button
            onClick={() => handleRemoveInput(index)}
            variant="destructive"
          >
            Remove
          </Button>
        </div>
      ))}
      <div className="flex">
        <Button onClick={handleAddInput} className="mx-1">
          Add Input
        </Button>

        {loadinbtn ? (
          <Button disabled>
            <Loader2 className="animate-spin" />
            Please wait
          </Button>
        ) : (
          inputs.length > 0 && (
            <Button onClick={handleSave} variant="default">
              Save
            </Button>
          )
        )}
      </div>

      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}

      {/* Dialog to delete dashboard */}
      <ConfirmDialog
        open={opendelete}
        setOpen={setOpendelete}
        handleConfirm={handleDeleteConfirmation}
      />
    </div>
  );
};

export default DynamicInputList;
