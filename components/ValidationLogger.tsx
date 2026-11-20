"use client";

import { useEffect } from "react";
import type { ValidationIssue } from "@/lib/validate-entries";

interface Props {
  issues: ValidationIssue[];
  totalEntries: number;
}

export function ValidationLogger({ issues, totalEntries }: Props) {
  useEffect(() => {
    if (issues.length === 0) return;

    const lines = [
      `[BMS Table] バリデーション: ${issues.length}件の問題を検出`,
    ];
    for (const issue of issues) {
      // 設定の誤り（rows が空）は特定の行に結び付かないので、件数と行番号を出さない
      if (issue.rows.length === 0) {
        lines.push(`  ⚠ カラム "${issue.column}" (${issue.detail}): ${issue.message}`);
        continue;
      }
      const rowInfo =
        issue.rows.length === totalEntries
          ? "全エントリ"
          : `行: ${issue.rows.slice(0, 10).join(", ")}${issue.rows.length > 10 ? ` 他${issue.rows.length - 10}件` : ""}`;
      lines.push(
        `  ⚠ カラム "${issue.column}" (${issue.detail}): ${issue.message} — ${issue.rows.length}件 (${rowInfo})`
      );
    }
    console.warn(lines.join("\n"));
  }, [issues, totalEntries]);

  return null;
}
