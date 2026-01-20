export type InputType = "text" | "number" | "date" | "datetime-local";

export interface InputData {
  type: InputType;
  value: string;
  label: string;
  isEditing: boolean;
  isHidden?: boolean; 
}

export interface DynamicInputItem {
  id?: number | string;
  inputListName: string;
  inputs: InputData[];
}