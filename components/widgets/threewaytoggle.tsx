import React, { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ThreeWayToggleProps {
  onChange: (value: string) => void;
  runValue: string;
}

const ThreeWayToggle: React.FC<ThreeWayToggleProps> = ({
  onChange,
  runValue,
}) => {
  const [alignment, setAlignment] = useState<string>(runValue);

  const handleAlignment = (value: string) => {
    setAlignment(value);
    onChange(value);

    //update db value
  };

  return (
    <div className="bg-background text-foreground flex justify-center">
      <ToggleGroup
        type="single"
        value={alignment}
        onValueChange={(value) => value && handleAlignment(value)}
        variant="outline"
      >
        <ToggleGroupItem
          value="off"
          aria-label="Toggle off"
          className={`${
            alignment === "off"
              ? "!bg-gray-400 !text-white border-transparent"
              : ""
          } font-normal`}
        >
          OFF
        </ToggleGroupItem>
        <ToggleGroupItem
          value="test"
          aria-label="Toggle test"
          className={`${
            alignment === "test"
              ? "!bg-gray-400 !text-white border-transparent"
              : ""
          } font-normal`}
        >
          TEST
        </ToggleGroupItem>
        <ToggleGroupItem
          value="prod"
          aria-label="Toggle prod"
          className={`${
            alignment === "prod"
              ? "!bg-gray-400 !text-white border-transparent"
              : ""
          } font-normal`}
        >
          PROD
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ThreeWayToggle;
