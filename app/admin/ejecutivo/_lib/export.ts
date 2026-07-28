import { type Table } from "@tanstack/react-table";
import { formatterDate } from "@/lib/utils/date";
import { AdminExecutive } from "@/interfaces/executive";

export function exportTableToCSV<TData extends AdminExecutive>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {},
): void {
  const {
    filename = "Ejecutivo",
    excludeColumns = [],
    onlySelected = false,
  } = opts;

  const roleLabels: Record<string, string> = {
    PRESIDENTE: "Presidente",
    VICEPRESIDENTE: "Vicepresidente",
    PRIMER_MINISTRO: "Primer Ministro",
    MINISTRO: "Ministro",
  };

  const formatValue = (header: string, value: unknown): string => {
    if (value instanceof Date) {
      return formatterDate(value);
    }

    if (value === null || value === undefined) {
      return "";
    }

    switch (header) {
      case "person":
        if (
          typeof value === "object" &&
          value !== null &&
          "fullname" in value
        ) {
          return String(value.fullname);
        }
        return String(value);
      case "role":
        return roleLabels[String(value)] ?? String(value);
      case "legislative_period":
        if (typeof value === "object" && value !== null && "name" in value) {
          return String(value.name);
        }
        return String(value);
      case "ministry":
      case "fullname":
      case "end_reason":
        return `"${String(value).replace(/"/g, '""')}"`;
      case "active":
        return String(value);
      default:
        return typeof value === "string"
          ? `"${value.replace(/"/g, '""')}"`
          : String(value);
    }
  };

  const headers = table
    .getAllLeafColumns()
    .filter(
      (column) =>
        !excludeColumns.includes(
          column.id as keyof TData | "select" | "actions",
        ),
    )
    .map((column) => {
      let title = column.id;

      if (typeof column.columnDef.header === "function") {
        const headerResult = column.columnDef.header({
          column,
          header: column.columnDef as never,
          table,
        });

        if (
          headerResult &&
          typeof headerResult === "object" &&
          "props" in headerResult &&
          headerResult.props &&
          typeof headerResult.props === "object" &&
          "title" in headerResult.props
        ) {
          title = String(headerResult.props.title);
        }
      } else if (typeof column.columnDef.header === "string") {
        title = column.columnDef.header;
      }

      return {
        id: column.id,
        title,
      };
    });

  const csvContent = [
    headers.map((header) => header.title).join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map((row) =>
      headers
        .map((header) => {
          const cellValue = row.getValue(header.id);
          return formatValue(header.id, cellValue);
        })
        .join(","),
    ),
  ].join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
