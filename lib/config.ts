import fs from "fs";
import path from "path";

export interface CourseEntry {
  name: string;
  constraint: string[];
  md5: string[];
}

export type Align = "left" | "center" | "right";
export type ThemeMode = "light" | "dark" | "system";

export interface LevelColumn {
  header: string;
  type: "level";
  width?: string;
  align?: Align;
  nowrap?: boolean;
  ellipsis?: boolean;
}

export interface TextColumn {
  header: string;
  type: "text";
  property: string;
  width?: string;
  align?: Align;
  nowrap?: boolean;
  ellipsis?: boolean;
}

export interface LinkColumn {
  header: string;
  type: "link";
  property: string;
  url: string;
  width?: string;
  align?: Align;
  nowrap?: boolean;
  ellipsis?: boolean;
}

export interface BadgeColumn {
  header: string;
  type: "badge";
  label: string;
  url: string;
  width?: string;
  align?: Align;
  nowrap?: boolean;
  ellipsis?: boolean;
}

export type ColumnDef = LevelColumn | TextColumn | LinkColumn | BadgeColumn;

export interface TableConfig {
  name: string;
  symbol: string;
  dataUrl: string;
  siteDescription: string;
  lightTheme: string;
  darkTheme: string;
  darkMode: ThemeMode;
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

export function loadConfig(): TableConfig {
  const localPath = path.join(process.cwd(), "table.config.local.json");
  const mainPath = path.join(process.cwd(), "table.config.json");
  const filePath = fs.existsSync(localPath) ? localPath : mainPath;
  const configJson = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  ) as Partial<TableConfig>;

  return {
    ...defaults,
    ...configJson,
  } as TableConfig;
}

export const config: TableConfig = loadConfig();
