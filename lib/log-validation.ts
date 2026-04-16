import type { ValidationResult } from "./validate-entries";

export function logValidationIssues(result: ValidationResult): void {
  if (result.issues.length === 0) return;

  const lines = [
    `[BMS Table] バリデーション: ${result.issues.length}件の問題を検出`,
  ];
  for (const issue of result.issues) {
    const rowInfo =
      issue.rows.length === result.totalEntries
        ? "全エントリ"
        : `行: ${issue.rows.slice(0, 10).join(", ")}${issue.rows.length > 10 ? ` 他${issue.rows.length - 10}件` : ""}`;
    lines.push(
      `  ⚠ カラム "${issue.column}" (${issue.detail}): ${issue.message} — ${issue.rows.length}件 (${rowInfo})`
    );
  }
  console.warn(lines.join("\n"));
}
