import configJson from "../table.config.json";

export interface CourseEntry {
  name: string;
  constraint: string[];
  md5: string[];
}

export interface TextColumn {
  header: string;
  type: "text";
  property: string;
  width?: string;
}

export interface LinkColumn {
  header: string;
  type: "link";
  property: string;
  url: string;
  width?: string;
}

export interface BadgeColumn {
  header: string;
  type: "badge";
  label: string;
  url: string;
  width?: string;
}

export type ColumnDef = TextColumn | LinkColumn | BadgeColumn;

export interface TableConfig {
  name: string;
  symbol: string;
  dataUrl: string;
  revalidate: number;
  siteDescription: string;
  lightTheme: string;
  darkTheme: string;
  darkMode: "light" | "dark" | "system";
  levelOrder: string[];
  course: CourseEntry[];
  columns: ColumnDef[];
}

const defaults: Omit<TableConfig, "name" | "symbol" | "dataUrl"> = {
  revalidate: 3600,
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: [],
  course: [],
  columns: [],
};

export const config: TableConfig = {
  ...defaults,
  ...(configJson as Partial<TableConfig>),
} as TableConfig;
