import packageJson from "@/package.json";

export const release = {
  name: "ONEORIGIN Workspace",
  version: packageJson.version,
  channel: "Public Beta",
  publicReadOnly: process.env.NODE_ENV === "production",
  repository: "https://github.com/z-ey3eiei/ai-origin",
} as const;

export const publicBetaMessage =
  "Public Beta is read-only. AI requests, knowledge search, uploads, and data changes are disabled until authentication and provider access are verified.";
