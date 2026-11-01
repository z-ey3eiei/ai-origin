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
  "ecosystem",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section !== "ecosystem") return {};
  return {
    title: "Tools & projects",
    description:
      "ONEORIGIN tools and repositories: DevStack, Aibotq, 1origin.dev, and ai-origin. Reviewed public entrypoints, integration boundaries, and production release checks.",
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <WorkspaceShell section={section as Section} />;
}
