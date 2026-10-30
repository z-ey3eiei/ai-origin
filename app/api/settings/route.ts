import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, readJSON } from "@/lib/api";
import { assertSameOrigin, workspaceIdentity } from "@/lib/workspace-identity";
import { putRecord } from "@/lib/aws/dynamo";
import { getModelCatalog } from "@/lib/ai/models";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  systemPrompt: z.string().trim().min(1).max(8000),
  defaultModel: z.string().max(200),
  maxOutputTokens: z.union([
    z.literal(512),
    z.literal(1024),
    z.literal(2048),
    z.literal(4096),
  ]),
});
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const settings = schema.parse(await readJSON(request, 16000));
    if (
      !(await getModelCatalog()).models.some(
        (model) => model.id === settings.defaultModel,
      )
    )
      throw new Error("Choose a supported model.");
    const owner = await workspaceIdentity();
    await putRecord(owner, "SETTINGS", settings);
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}
