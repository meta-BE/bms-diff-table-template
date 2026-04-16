import { NextResponse } from "next/server";
import { fetchTableData } from "@/lib/fetch-table-data";

// Route Handler自体のISR間隔（静的リテラルのみ許可）
// データキャッシュはfetchTableData内のnext.revalidateオプション（config.revalidate）で別途制御される
export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchTableData();
    return NextResponse.json(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
