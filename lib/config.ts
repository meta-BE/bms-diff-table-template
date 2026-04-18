import configJson from "../table.config.json";

export interface CourseEntry {
  name: string;
  constraint: string[];
  md5: string[];
}

export type Align = "left" | "center" | "right";

export interface LevelColumn {
  header: string;
  type: "level";
  width?: string;
  align?: Align;
}

export interface TextColumn {
  header: string;
  type: "text";
  property: string;
  width?: string;
  align?: Align;
}

export interface LinkColumn {
  header: string;
  type: "link";
  property: string;
  url: string;
  width?: string;
  align?: Align;
}

export interface BadgeColumn {
  header: string;
  type: "badge";
  label: string;
  url: string;
  width?: string;
  align?: Align;
}

export type ColumnDef = LevelColumn | TextColumn | LinkColumn | BadgeColumn;

export interface TableConfig {
  name: string;
  symbol: string;
  dataUrl: string;
  siteDescription: string;
  lightTheme: string;
  darkTheme: string;
  darkMode: "light" | "dark" | "system";
  levelOrder: string[];
  course: CourseEntry[];
  columns: ColumnDef[];
}

const defaults: Omit<TableConfig, "name" | "symbol" | "dataUrl"> = {
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
