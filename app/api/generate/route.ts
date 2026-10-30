import { generateText, Output } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { apiError, readJSON } from "@/lib/api";
import { assertSameOrigin, workspaceIdentity } from "@/lib/workspace-identity";
import { consumeQuota, saveTurn } from "@/lib/aws/dynamo";
import { resolveModel } from "@/lib/ai/models";

export const maxDuration = 300;
const architectureSchema = z.object({
  title: z.string(),
  summary: z.string(),
  components: z
    .array(
      z.object({
        name: z.string(),
        service: z.string(),
        description: z.string(),
      }),
    )
    .min(1)
    .max(8),
  steps: z.array(z.string()).min(1).max(8),
});
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { prompt } = z
      .object({ prompt: z.string().trim().min(1).max(4000) })
      .parse(await readJSON(request, 10000));
    const owner = await workspaceIdentity();
    await consumeQuota(owner);
    const modelId =
      process.env.ORIGIN_INFERENCE_MODE === "bedrock"
        ? "amazon/nova-pro"
        : "anthropic/claude-sonnet-5.5";
    const start = performance.now();
    const result = await generateText({
      model: await resolveModel(modelId),
      instructions:
        "You are an experienced AWS architect. Design a pragmatic secure architecture from the request. Never claim any infrastructure was deployed. Provide concise implementation steps and accurate service names.",
      prompt,
      output: Output.object({ schema: architectureSchema }),
      maxOutputTokens: 2500,
      abortSignal: request.signal,
      timeout: 180000,
      telemetry: { recordInputs: false, recordOutputs: false },
    });
    await saveTurn(owner, {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      modelId,
      prompt,
      response: JSON.stringify(result.output),
      inputTokens: result.usage.inputTokens || 0,
      outputTokens: result.usage.outputTokens || 0,
      durationMs: Math.round(performance.now() - start),
      ttftMs: null,
      status: "success",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ output: result.output });
  } catch (error) {
    return apiError(error);
  }
}
