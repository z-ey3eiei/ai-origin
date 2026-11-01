export type Section =
  | "overview"
  | "playground"
  | "models"
  | "knowledge"
  | "generative"
  | "logs"
  | "infrastructure"
  | "settings"
  | "docs"
  | "ecosystem";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  context: number;
}

export interface ChatTurn {
  id: string;
  sessionId: string;
  modelId: string;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  ttftMs: number | null;
  durationMs: number;
  status: "success" | "error" | "aborted";
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  chunks: number;
  createdAt: string;
  status: "indexed" | "stored";
}

export interface WorkspaceSettings {
  name: string;
  systemPrompt: string;
  defaultModel: string;
  maxOutputTokens: number;
}

export interface WorkspaceData {
  turns: ChatTurn[];
  documents: KnowledgeDocument[];
  settings: WorkspaceSettings;
  storage: { connected: boolean; message: string };
}

export interface ResourceStatus {
  id: string;
  name: string;
  description: string;
  status: "connected" | "unconfigured" | "error";
  message: string;
}

export const defaultSettings: WorkspaceSettings = {
  name: "Origin workspace",
  systemPrompt:
    "You are AI Origin, an expert software and cloud engineering assistant. Give accurate, thoughtful, practical answers. Respond in the language of the user.",
  defaultModel: "anthropic/claude-sonnet-5.5",
  maxOutputTokens: 2048,
};
