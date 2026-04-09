import { config } from "./config";

export interface TableEntry {
  md5: string;
  level: string;
  [key: string]: unknown;
}

export async function fetchTableData(
  url: string = config.dataUrl
): Promise<TableEntry[]> {
  const res = await fetch(url, {
    redirect: "follow",
    next: { revalidate: config.revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `データの取得に失敗しました: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}
