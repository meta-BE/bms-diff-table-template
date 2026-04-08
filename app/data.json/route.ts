import { NextResponse } from "next/server";
import { fetchTableData } from "@/lib/fetch-table-data";
import { config } from "@/lib/config";

export const revalidate = config.revalidate;

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
