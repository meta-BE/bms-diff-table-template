"use client";

import { useEffect } from "react";
import type { ValidationIssue } from "@/lib/validate-entries";

interface ValidationLoggerProps {
  issues: ValidationIssue[];
}

export function ValidationLogger({ issues }: ValidationLoggerProps) {
  useEffect(() => {
    if (issues.length === 0) return;

    const lines = [
      `[BMS Table] バリデーション: ${issues.length}件の問題を検出`,
    ];
    for (const issue of issues) {
      const rowInfo =
        issue.rows.length === issue.totalEntries
          ? "全エントリ"
          : `行: ${issue.rows.join(", ")}`;
      lines.push(
        `  ⚠ カラム "${issue.column}" (${issue.detail}): ${issue.message} — ${issue.rows.length}件 (${rowInfo})`
      );
    }
    console.warn(lines.join("\n"));
  }, [issues]);

  return null;
}
