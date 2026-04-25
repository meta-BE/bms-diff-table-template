"use client";

import { useEffect } from "react";

export function CacheWarmer() {
  useEffect(() => {
    void fetch("/data.json");
  }, []);

  return null;
}
