import configJson from "../table.config.json";

export interface CourseEntry {
  name: string;
  constraint: string[];
  md5: string[];
}

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
}

const defaults: Omit<TableConfig, "name" | "symbol" | "dataUrl"> = {
  revalidate: 3600,
  siteDescription: "",
  lightTheme: "light",
  darkTheme: "dark",
  darkMode: "system",
  levelOrder: [],
  course: [],
};

export const config: TableConfig = {
  ...defaults,
  ...(configJson as Partial<TableConfig>),
} as TableConfig;
