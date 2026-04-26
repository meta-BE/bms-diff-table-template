import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const dynamic = "force-static";

export async function GET() {
  const header: Record<string, unknown> = {
    name: config.name,
    symbol: config.symbol,
    data_url: "/data.json",
  };

  if (config.levelOrder.length > 0) {
    header.level_order = config.levelOrder;
  }

  if (config.course.length > 0) {
    header.course = config.course;
  }

  return NextResponse.json(header, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
