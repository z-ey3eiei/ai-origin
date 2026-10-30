"use client";

import useSWR from "swr";
import type { ModelInfo, ResourceStatus, WorkspaceData } from "./types";

export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data;
}

export function useWorkspace() {
  return useSWR<WorkspaceData>("/api/workspace", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useModels() {
  return useSWR<{ models: ModelInfo[]; total: number }>(
    "/api/models",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );
}

export function useResources() {
  return useSWR<{ resources: ResourceStatus[] }>("/api/status", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

export function downloadFile(
  content: string,
  name: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
