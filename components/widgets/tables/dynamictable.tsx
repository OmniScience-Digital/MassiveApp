"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Edit, Save, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReportItem } from "@/types/schema";
import ResponseModal from "../response";
import { createDynamicTable, deleteDynamicTable } from "@/service/dynamicTable.service";


export interface DynamicTableProps {
  table: ReportItem["dynamic_tables"];
  tableCount: number;
  setDynamictables: React.Dispatch<React.SetStateAction<ReportItem["dynamic_tables"]>>;
  setDbTableCount: React.Dispatch<React.SetStateAction<number>>;
}


export default function DynamicTable({
  table,
  tableCount,
  setDbTableCount,
  setDynamictables,
}: DynamicTableProps) {


  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [headerName, setHeaderName] = useState(table[0].tableName);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [loadingSave, setloadingSave] = useState(false);
  const [loadingDelete, setloadingDelete] = useState(false);



  const [tables, setTables] = useState<ReportItem["dynamic_tables"]>(() => {
    return table.map(t => ({
      ...t,
      tableName: t.tableName || headerName
    }));
  });


  const [isEdited, setIsEdited] = useState(false);
  const [headerEdited, setHeaderEdited] = useState(false);


  //response hooks
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState('');

  // Update tableName when headerName changes
  useEffect(() => {
    if (tables.length > 0 && headerEdited) {
      setTables(prevTables => {
        return prevTables.map((t, index) => {
          if (index === 0) {
            return { ...t, tableName: headerName };
          }
          return t;
        });
      });
    }
  }, [headerName, headerEdited]);

  // Track changes to the tables
  useEffect(() => {
    setIsEdited(true);
  }, [tables]);

  // Track header name changes
  useEffect(() => {
    if (isEditingHeader) {
      setHeaderEdited(true);
    }
  }, [headerName, isEditingHeader]);

  // Save function

      
  const handleSave = async () => {
    try {
      setloadingSave(true)

      const saveTabletoDb = await createDynamicTable(id as string, tables as ReportItem['dynamic_tables']);

      if (saveTabletoDb) {
        setSuccessful(true);
        setMessage(saveTabletoDb.message as unknown as string);
        setloadingSave(false);
        setShow(true);
        // Update tableCount to match the new state
         setDynamictables(saveTabletoDb.table);
        setDbTableCount(tableCount + 1);
      }



    } catch (error) {
      console.error('Error creating table:', error);
      setSuccessful(false);
      setMessage('Failed to create table');
      setShow(true);
    } finally {
      setIsEdited(false);
      setHeaderEdited(false);
      setloadingSave(false)
    }
  };


  const addRow = (tableId: number) => {
    const updatedTables = tables.map((table) =>
      table.id === tableId
        ? {
          ...table,
          data: [
            ...table.data,
            {
              id: Date.now(),
              ...table.columns.reduce((acc, column) => ({ ...acc, [column]: "" }), {}),
            },
          ],
        }
        : table
    );
    setTables(updatedTables);
  };

  const deleteRow = (tableId: number, rowId: number) => {
    const updatedTables = tables.map((table) =>
      table.id === tableId
        ? {
          ...table,
          data: table.data.filter((row) => row.id !== rowId),
        }
        : table
    );
    setTables(updatedTables);
  };

  const addColumn = (tableId: number) => {
    const updatedTables = tables.map((table) =>
      table.id === tableId
        ? {
          ...table,
          columns: [...table.columns, `Column ${table.columns.length + 1}`],
          data: table.data.map((row) => ({
            ...row,
            [`Column ${table.columns.length + 1}`]: "",
          })),
        }
        : table
    );
    setTables(updatedTables);
  };

  const deleteColumn = (tableId: number, columnIndex: number) => {
    const table = tables.find((table) => table.id === tableId);
    if (table) {
      const updatedTables = tables.map((table) =>
        table.id === tableId
          ? {
            ...table,
            columns: table.columns.filter((_, i) => i !== columnIndex),
            data: table.data.map((row) => {
              const newRow = { ...row };
              delete newRow[table.columns[columnIndex]];
              return newRow;
            }),
          }
          : table
      );
      setTables(updatedTables);
    }
  };

  const handleCellEdit = (
    tableId: number,
    rowId: number,
    columnIndex: number,
    value: string
  ) => {
    const updatedTables = tables.map((table) =>
      table.id === tableId
        ? {
          ...table,
          data: table.data.map((row) =>
            row.id === rowId
              ? { ...row, [table.columns[columnIndex]]: value }
              : row
          ),
        }
        : table
    );
    setTables(updatedTables);
  };

  const handleDeleteComponent = async () => {


    try {

      setloadingDelete(true);
      const sites = await deleteDynamicTable(id as string, (tables[0].id) as number);


      setDynamictables(sites);
      setSuccessful(true);
      setMessage('Table deleted successfully');
      setloadingDelete(false);
      setShow(true);


    } catch (error) {
      console.error('Error deleting table:', error);
      setSuccessful(false);
      setMessage('Failed to delete table');
      setloadingDelete(false);
      setShow(true);


    }
  };


  const isDisabled = !(isEdited || headerEdited);

  return (
    <div className="p-2 border rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        {isEditingHeader ? (
          <Input
            type="text"
            value={headerName ?? ""}
            onChange={(e) => {
              setHeaderName(e.target.value);
            }}
            onBlur={() => {
              if (headerName.trim() === "") {
                setHeaderName("Untitled Table");
              }
              setIsEditingHeader(false);
            }}
            autoFocus
            className="w-2/3"
          />
        ) : (
          <h2
            className="text-lg font-semibold"
            onClick={() => setIsEditingHeader(true)}
          >
            {headerName}
          </h2>
        )}
        {!isEditingHeader && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingHeader(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {isEditingHeader && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingHeader(false)}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="mb-4">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Input Field</DialogTitle>
              <DialogDescription>
                Please select available inputs.
              </DialogDescription>
            </DialogHeader>

          </DialogContent>
        </Dialog>

        {tables.map((table) => (
          <div
            key={table.id}
            className="p-4 border rounded-lg shadow-sm bg-background space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Button
                onClick={() => addRow(table.id)}
                variant="outline"
                size="sm"
              >
                Add Row
              </Button>
              <Button
                onClick={() => addColumn(table.id)}
                variant="outline"
                size="sm"
              >
                Add Column
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {table.columns.map((column, columnIndex) => (
                      <th key={columnIndex} className="border p-2">
                        <Input
                          type="text"
                          value={column ?? ""}
                          onChange={(e) => {
                            const updatedTables = tables.map((t) =>
                              t.id === table.id
                                ? {
                                  ...t,
                                  columns: t.columns.map((col, i) =>
                                    i === columnIndex ? e.target.value : col
                                  ),
                                  data: t.data.map((row) => {
                                    const newRow = { ...row };
                                    const oldKey = column;
                                    const newKey = e.target.value;
                                    if (oldKey in newRow) {
                                      newRow[newKey] = newRow[oldKey];
                                      delete newRow[oldKey];
                                    }
                                    return newRow;
                                  }),
                                }
                                : t
                            );
                            setTables(updatedTables);
                          }}
                          className="w-full"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteColumn(table.id, columnIndex)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </th>
                    ))}
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {table.data.map((row) => (
                    <tr key={row.id}>
                      {table.columns.map((column, columnIndex) => (
                        <td key={columnIndex} className="border p-2">
                          <Input
                            type="text"
                             value={row[column] || ''}
                            onChange={(e) =>
                              handleCellEdit(
                                table.id,
                                row.id,
                                columnIndex,
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        </td>
                      ))}
                      <td className="border p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRow(table.id, row.id)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {show && <ResponseModal successful={successful} message={message} setShow={setShow} />}
      </div>

      <div className="flex justify-end">


        {loadingDelete ? (<Button className="mr-2" disabled>
          <Loader2 className="animate-spin" />
          Please wait
        </Button>) : (
          <Button
            variant="destructive"
            onClick={handleDeleteComponent}
            className="mx-3"
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </Button>)}

        {loadingSave ? (<Button className="mr-2" disabled>
          <Loader2 className="animate-spin" />
          Please wait
        </Button>) : (
          <Button onClick={handleSave} disabled={isDisabled}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>)}
      </div>
    </div>
  );
}