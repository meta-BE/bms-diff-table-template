import fs from "fs";
import path from "path";

export function loadDescription(): string | null {
  const filePath = path.join(process.cwd(), "description.html");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
