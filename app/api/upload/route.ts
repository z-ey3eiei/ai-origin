import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, readJSON } from "@/lib/api";
import { assertSameOrigin, workspaceIdentity } from "@/lib/workspace-identity";
import { consumeQuota } from "@/lib/aws/dynamo";
import { presignedUpload } from "@/lib/aws/s3";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = z
      .object({
        contentType: z.enum([
          "text/plain",
          "text/markdown",
          "application/pdf",
          "image/png",
          "image/jpeg",
        ]),
        size: z.number().int().positive().max(5000000),
      })
      .parse(await readJSON(request, 2000));
    const owner = await workspaceIdentity();
    await consumeQuota(owner);
    return NextResponse.json(
      await presignedUpload(owner, input.contentType, input.size),
    );
  } catch (error) {
    return apiError(error);
  }
}
