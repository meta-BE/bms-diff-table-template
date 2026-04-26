import { NextResponse } from "next/server";
import { fetchTableData } from "@/lib/fetch-table-data";

// 静的リテラルのみ許可: Next.js がビルド時に静的解析するため式は使えない
export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchTableData();
    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
