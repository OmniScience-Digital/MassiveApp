import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updatePrimaryScales } from "@/service/primaryScales.Service";
import { useParams } from "next/navigation";
import ResponseModal from "./response";
import { Loader2, Plus, X } from "lucide-react";

interface PrimaryScalesSelectorProps {
  scales: {
    scalename: string;
    iccid: string;
  }[];
  primaryScales: string[];
  onSave: (selectedScales: string[]) => void;
}

export const PrimaryScalesSelector = ({
  scales,
  primaryScales,
  onSave,
}: PrimaryScalesSelectorProps) => {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [selectedScales, setSelectedScales] = useState<string[]>(primaryScales);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [newScaleName, setNewScaleName] = useState("");
  const [customScales, setCustomScales] = useState<string[]>([]);
  const [showAddScale, setShowAddScale] = useState(false);
  const [persistedCustomScales, setPersistedCustomScales] = useState<string[]>(
    [],
  );
  const [removedScales, setRemovedScales] = useState<string[]>([]);

  // Initialize custom scales by comparing primaryScales with normal scales
  useEffect(() => {
    const normalScaleNames = scales.map((scale) => scale.scalename);
    const customScalesFromProps = primaryScales.filter(
      (scaleName) => !normalScaleNames.includes(scaleName),
    );
    setPersistedCustomScales(customScalesFromProps);
  }, [scales, primaryScales]);

  const handleScaleToggle = (scaleName: string) => {
    setSelectedScales((prev) =>
      prev.includes(scaleName)
        ? prev.filter((name) => name !== scaleName)
        : [...prev, scaleName],
    );
  };

  const handleAddScale = () => {
    const trimmedName = newScaleName.trim();
    if (!trimmedName) return;

    const allScaleNames = [
      ...scales.map((s) => s.scalename),
      ...persistedCustomScales,
      ...customScales,
    ];

    if (allScaleNames.includes(trimmedName)) {
      setMessage("Scale already exists");
      setSuccessful(false);
      setShow(true);
      return;
    }

    setCustomScales((prev) => [...prev, trimmedName]);
    setSelectedScales((prev) => [...prev, trimmedName]);
    setNewScaleName("");
    setShowAddScale(false);
  };

  const handleRemoveCustomScale = async (
    scaleName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    // Update UI immediately
    if (persistedCustomScales.includes(scaleName)) {
      setPersistedCustomScales((prev) =>
        prev.filter((name) => name !== scaleName),
      );
    } else {
      setCustomScales((prev) => prev.filter((name) => name !== scaleName));
    }
    setSelectedScales((prev) => prev.filter((name) => name !== scaleName));

    // Track removed scales to update database on save
    setRemovedScales((prev) => [...prev, scaleName]);
  };

  const handleSave = async () => {
    try {
      setLoadingSave(true);

      // Remove any scales that were marked for removal
      const finalScales = selectedScales.filter(
        (scale) => !removedScales.includes(scale),
      );

      const primaryScaleAdd = await updatePrimaryScales(id, finalScales);

      if (primaryScaleAdd) {
        setSuccessful(true);
        setMessage("Primary Scales updated successfully");
        setShow(true);

        // Update persisted custom scales
        const newPersistedCustomScales = finalScales.filter(
          (scale) => !scales.some((s) => s.scalename === scale),
        );
        setPersistedCustomScales(newPersistedCustomScales);

        // Reset temporary states
        setCustomScales([]);
        setRemovedScales([]);

        // Notify parent component
        onSave(finalScales);
      } else {
        throw new Error("Failed to update primary scales");
      }
    } catch (error) {
      setSuccessful(false);
      setMessage(
        error instanceof Error ? error.message : "Failed to update scales",
      );
      setShow(true);

      // Revert changes if save fails
      const normalScaleNames = scales.map((scale) => scale.scalename);
      const customScalesFromProps = primaryScales.filter(
        (scaleName) => !normalScaleNames.includes(scaleName),
      );
      setPersistedCustomScales(customScalesFromProps);
      setSelectedScales(primaryScales);
    } finally {
      setLoadingSave(false);
    }
  };

  // Combine all scales for display
  const allDisplayScales = [
    ...scales,
    ...persistedCustomScales.map((scalename) => ({
      scalename,
      iccid: `custom-${scalename}`,
    })),
    ...customScales.map((scalename) => ({
      scalename,
      iccid: `temp-${scalename}`,
    })),
  ];

  return (
    <Card className="px-6 py-2 border h-full w-full rounded-lg shadow-sm bg-background space-y-4">
      <CardHeader>
        <CardTitle>Primary Scales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            {/* All scales - both normal and custom */}
            {allDisplayScales.map((scale) => (
              <div key={scale.iccid} className="flex items-center space-x-2">
                <Checkbox
                  id={`scale-${scale.iccid}`}
                  checked={
                    selectedScales.includes(scale.scalename) &&
                    !removedScales.includes(scale.scalename)
                  }
                  onCheckedChange={() => handleScaleToggle(scale.scalename)}
                />
                <label
                  htmlFor={`scale-${scale.iccid}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                >
                  {scale.scalename}
                  {/* Show remove button only for custom scales */}
                  {(persistedCustomScales.includes(scale.scalename) ||
                    customScales.includes(scale.scalename)) && (
                    <button
                      onClick={(e) =>
                        handleRemoveCustomScale(scale.scalename, e)
                      }
                      className="ml-2 text-red-500 hover:text-red-700"
                      aria-label={`Remove ${scale.scalename}`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
              </div>
            ))}

            {/* Add new scale input */}
            {showAddScale ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newScaleName}
                  onChange={(e) => setNewScaleName(e.target.value)}
                  placeholder="Enter new scale name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddScale()}
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddScale}
                  disabled={!newScaleName.trim()}
                >
                  <Plus size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewScaleName("");
                    setShowAddScale(false);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setShowAddScale(true)}
              >
                <Plus size={16} className="mr-2" />
                Add Custom Scale
              </Button>
            )}
          </div>

          {loadingSave ? (
            <Button className="w-full mr-2" disabled>
              <Loader2 className="animate-spin mr-2" />
              Please wait
            </Button>
          ) : (
            <Button onClick={handleSave} className="w-full">
              Save Selection
            </Button>
          )}

          {show && (
            <ResponseModal
              successful={successful}
              message={message}
              setShow={setShow}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
