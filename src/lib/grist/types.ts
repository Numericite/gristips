/**
 * TypeScript interfaces for Grist API responses
 */

export interface GristDocument {
  id: string;
  name: string;
  urlId: string;
  access: "owners" | "editors" | "viewers";
}

export interface GristColumn {
  id: string;
  colId: string;
  type:
    | "Text"
    | "Numeric"
    | "Int"
    | "Bool"
    | "Date"
    | "DateTime"
    | "Choice"
    | "Ref"
    | "Any";
  label: string;
  isFormula: boolean;
}

export interface GristTable {
  id: string;
  tableId: string;
  columns: GristColumn[];
}

export interface GristApiError {
  error: string;
  details?: string;
}

export interface GristDocumentsResponse {
  docs: GristDocument[];
}

export interface GristTablesResponse {
  tables: Array<{
    id: string;
    tableId: string;
    columns: GristColumn[];
  }>;
}

export interface GristTableSchemaResponse {
  tables: Array<{
    id: string;
    tableId: string;
    columns: GristColumn[];
  }>;
}
