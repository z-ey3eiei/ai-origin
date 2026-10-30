import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/platform/shell";
import type { Section } from "@/lib/types";

const sections = [
  "playground",
  "models",
  "knowledge",
  "generative",
  "logs",
  "infrastructure",
  "settings",
  "docs",
];

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <WorkspaceShell section={section as Section} />;
}
