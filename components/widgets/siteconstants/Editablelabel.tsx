import React, { useState, useEffect } from "react";
import { EditIcon, SaveIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { SiteConstantsInterface } from "@/types/schema";
import { updateSiteConstants } from "@/service/siteConstants.Service";
import { useParams } from "next/navigation";
import ResponseModal from "../response";

interface EditableLabelProps {
  label: string;
  value?: any;
  onSave: (label: string, value: string) => void;
}

const EditableLabel: React.FC<EditableLabelProps> = ({
  label,
  value = "",
  onSave,
}) => {
  if (typeof value === "boolean") {
    value = value ? "True" : "False";
  }

  const [editedValue, setEditedValue] = useState<string>(value ?? "");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Update local state when prop changes
  useEffect(() => {
    setEditedValue(value ?? "");
  }, [value]);

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = () => {
    setIsEditing(false);
    onSave(label, editedValue);
  };

  const handleCancelClick = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setEditedValue(event.target.value);

  return (
    <Card className="px-2 my-1 flex justify-between items-center gap-2">
      <span className="text-xs uppercase tracking-wide font-semibold flex-shrink-0">
        {label} :
      </span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <>
            {label === "reportTo" || label === "shiftftp" || label === "scaleType" || label === "template" || label === "siteType" ? (
              <Select value={editedValue} onValueChange={setEditedValue}>
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {label === "template" ? (
                    <>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Split flow Graphs">Split flow graphs</SelectItem>
                    </>
                  ) : label === "reportTo" ? (
                    <>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Telegram">Telegram</SelectItem>
                      <SelectItem value="Telegram & Email">
                        Telegram & Email
                      </SelectItem>
                    </>
                  ) : label === "shiftftp" ? (
                    <>
                      <SelectItem value="monthtons">Monthtons</SelectItem>
                      <SelectItem value="totalizer">Totalizer</SelectItem>
                    </>
                  ) : label === "scaleType" ? (
                    <>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="parallel">Parallel</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="iot">Iot Based</SelectItem>
                      <SelectItem value="plc">PLC Based</SelectItem>
                      <SelectItem value="iotnplc">Iot & PLC Based</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={editedValue}
                onChange={handleChange}
                autoFocus
                className="text-sm flex-1 min-w-[50px]"
              />
            )}
            <Button onClick={handleSaveClick} size="icon" variant="ghost">
              <SaveIcon className="w-4 h-4" />
            </Button>
            <Button onClick={handleCancelClick} size="icon" variant="ghost">
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm truncate flex-1 text-right">
              {editedValue}
            </span>
            <Button onClick={handleEditClick} size="icon" variant="ghost">
              <EditIcon className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

interface SiteConstantsProps {
  siteConstants: SiteConstantsInterface;
  onUpdate?: (updatedConstants: SiteConstantsInterface) => void;
}

const EditableSiteConstants = ({
  siteConstants,
  onUpdate
}: SiteConstantsProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  // Create local state that mirrors the props
  const [localSiteConstants, setLocalSiteConstants] = useState<SiteConstantsInterface>({
    ...siteConstants,
    template: siteConstants.template || ""
  });


  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");


  const handleSave = async (key: string, newValue: string) => {
    // Save currentValue at the beginning so it's available in catch block
    const currentValue = localSiteConstants[key as keyof SiteConstantsInterface];

    // Don't proceed if value hasn't changed
    if (newValue === String(currentValue)) {
      return;
    }

    try {
      // 1. Save previous value for potential rollback
      const previousValue = currentValue;

      // 2. Create updated constants
      const updatedConstants = {
        ...localSiteConstants,
        [key]: newValue,
      };

      // 3. Update LOCAL state immediately
      setLocalSiteConstants(updatedConstants);

      // 4. Update PARENT state immediately
      if (onUpdate) {
        onUpdate(updatedConstants);
      }

      // 5. Send to server
      await updateSiteConstants(id as string, updatedConstants);

      setSuccessful(true);
      setMessage("Constant updated successfully");
      setShow(true);

      // DON'T call fetchData() - we already updated both states
    } catch (error) {
      console.error(`Failed to update ${newValue}:`, error);

      // Revert BOTH states on error
      const revertedConstants = {
        ...localSiteConstants,
        [key]: String(currentValue),
      };

      setLocalSiteConstants(revertedConstants);

      if (onUpdate) {
        onUpdate(revertedConstants);
      }

      setSuccessful(false);
      setMessage("Failed to update constant");
      setShow(true);
    }
  };


  return (
    <div>
      {Object.entries(localSiteConstants).map(([key, value]) => (
        <EditableLabel
          key={key}
          label={key}
          value={value ?? ""}
          onSave={handleSave}
        />
      ))}
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

export default EditableSiteConstants;
