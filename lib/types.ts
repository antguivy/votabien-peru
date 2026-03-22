import { ColumnSort, type Row } from "@tanstack/react-table";
import { type z } from "zod";
import { type DataTableConfig } from "./data-table";
import { type filterSchema } from "@/lib/parsers";

// Utilidad para mejorar la legibilidad de tipos
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type StringKeyOf<TData> = Extract<keyof TData, string>;

// Parámetros de búsqueda
export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Opción para los filtros
export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

// Extensión de ordenación para incluir las claves de `TData`
export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: StringKeyOf<TData>;
}

export type ExtendedSortingState<TData> = ExtendedColumnSort<TData>[];

export type ColumnType = DataTableConfig["columnTypes"][number];
export type FilterOperator = DataTableConfig["globalOperators"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number]["value"];

// Campo de filtro para la tabla
export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData>;
  label: string;
  placeholder?: string;
  options?: Option[];
}

// Campo avanzado de filtro para la tabla
export interface DataTableAdvancedFilterField<TData>
  extends DataTableFilterField<TData> {
  type: ColumnType;
}

// Definición de filtros para Zod
export type Filter<TData> = Prettify<
  Omit<z.infer<typeof filterSchema>, "id"> & {
    id: StringKeyOf<TData>;
  }
>;

// Acción para las filas
export interface DataTableRowAction<TData> {
  row: Row<TData>;
  type:
    | "update"
    | "update-bancada"
    | "update-biography"
    | "update-background"
    | "research";
}

// Opciones de Query para Prisma
export interface QueryBuilderOpts<TData> {
  where?: Partial<Record<keyof TData, unknown>>; // Cambia User por el modelo que uses en Prisma
  orderBy?: Partial<Record<keyof TData, "asc" | "desc">>;
  distinct?: boolean;
  nullish?: boolean;
}
