// src/types/inputdata.ts
type InputType = "text" | "number" | "date" | "datetime-local";

interface InputData {
  type: InputType;
  value: string;
  label: string;
  isEditing: boolean;
}

export default InputData;
