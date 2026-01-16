import { type Table } from "@tanstack/react-table";
import { formatterDate } from "@/lib/utils/date";
import { AdminPoliticalParty } from "@/interfaces/party";

export function exportTableToCSV<TData extends AdminPoliticalParty>(
  /**
   * The table to export.
   * @type Table<TData>
   */
  table: Table<TData>,
  opts: {
    /**
     * The filename for the CSV file.
     * @default "incidents"
     * @example "incidents-2024"
     */
    filename?: string;
    /**
     * The columns to exclude from the CSV file.
     * @default []
     * @example ["select", "actions"]
     */
    excludeColumns?: (keyof TData | "select" | "actions")[];
    /**
     * Whether to export only the selected rows.
     * @default false
     */
    onlySelected?: boolean;
  } = {},
): void {
  const {
    filename = "Legisladores",
    excludeColumns = [],
    onlySelected = false,
  } = opts;

  // Define custom formatters for specific fields
  const formatValue = (header: string, value: unknown): string => {
    if (value instanceof Date) {
      return formatterDate(value);
    }

    // Handle null or undefined
    if (value === null || value === undefined) {
      return "";
    }

    // Format specific fields based on AdminLegislator interface
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
      case "original_party":
      case "current_party":
        if (typeof value === "object" && value !== null && "name" in value) {
          return String(value.name);
        }
        return String(value);
      case "electoral_district":
        if (typeof value === "object" && value !== null && "name" in value) {
          return String(value.name);
        }
        return String(value);
      case "chamber":
      case "condition":
      case "active":
        return String(value);
      case "institutional_email":
      case "parliamentary_group":
      case "fullname":
        // Handle strings that might contain commas or newlines
        return `"${String(value).replace(/"/g, '""')}"`;
      default:
        return typeof value === "string"
          ? `"${value.replace(/"/g, '""')}"`
          : String(value);
    }
  };

  // Retrieve headers (column names)
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

  // Build CSV content
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

  // Create a Blob with CSV content
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create a link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up the URL object
}
