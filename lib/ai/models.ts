import "server-only";
import type { ModelInfo } from "@/lib/types";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

const curatedIds = [
  "anthropic/claude-sonnet-5.5",
  "openai/gpt-5.5",
  "google/gemini-3.8-flash",
  "amazon/nova-2-lite",
  "anthropic/claude-haiku-5.5",
  "openai/gpt-5.4-mini",
  "google/gemini-3.1-pro-preview",
  "amazon/nova-pro",
  "openai/gpt-5.4-nano",
];
interface GatewayModel {
  id: string;
  name?: string;
  description?: string;
  context_window?: number;
  type?: string;
  pricing?: { input?: string; output?: string };
}

export async function getModelCatalog() {
  const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("The live AI Gateway catalog is temporarily unavailable.");
  const { data } = (await response.json()) as { data: GatewayModel[] };
  const models: ModelInfo[] = curatedIds.flatMap((id) => {
    const model = data.find((entry) => entry.id === id);
    return model
      ? [
          {
            id: model.id,
            name: model.name || model.id.split("/")[1],
            provider: model.id.split("/")[0],
            description: model.description || "",
            context: model.context_window || 0,
            inputPrice: Number(model.pricing?.input || 0),
            outputPrice: Number(model.pricing?.output || 0),
          },
        ]
      : [];
  });
  return {
    models,
    total: data.filter(
      (model) =>
        model.type !== "embedding" &&
        !/embedding|transcribe|tts|image|video|rerank/.test(model.id),
    ).length,
  };
}

export async function resolveModel(id: string) {
  const catalog = await getModelCatalog();
  if (!catalog.models.some((model) => model.id === id))
    throw new Error("Choose a supported model from the model catalog.");
  if (process.env.ORIGIN_INFERENCE_MODE !== "bedrock") return id;
  if (!id.startsWith("amazon/"))
    throw new Error(
      "The AWS-native inference deployment currently supports the Amazon Nova models. Select a Nova model.",
    );
  const mappings: Record<string, string> = {
    "amazon/nova-pro": "us.amazon.nova-pro-v1:0",
    "amazon/nova-2-lite": "us.amazon.nova-2-lite-v1:0",
  };
  if (!mappings[id])
    throw new Error(
      "This model has no AWS-native inference profile configured.",
    );
  const bedrock = createAmazonBedrock({
    region: process.env.AWS_REGION || "us-east-1",
    credentialProvider: fromNodeProviderChain(),
  });
  return bedrock(mappings[id]);
}
