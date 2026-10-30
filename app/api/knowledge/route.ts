import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, readJSON } from "@/lib/api";
import { assertSameOrigin, workspaceIdentity } from "@/lib/workspace-identity";
import { consumeQuota, getDocuments, updateDocuments } from "@/lib/aws/dynamo";
import { storeDocument, removeDocument } from "@/lib/aws/s3";
import {
  indexDocument,
  retrieveKnowledge,
  removeIndexedDocument,
} from "@/lib/aws/search";

export const maxDuration = 300;
const documentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(80000),
});
export async function GET(request: Request) {
  try {
    const owner = await workspaceIdentity();
    const query = z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .parse(new URL(request.url).searchParams.get("q"));
    await consumeQuota(owner);
    return NextResponse.json(
      { results: await retrieveKnowledge(owner, query, request.signal) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { title, content } = documentSchema.parse(await readJSON(request));
    const owner = await workspaceIdentity();
    await consumeQuota(owner);
    const existing = await getDocuments(owner);
    if (
      existing.length >= 30 ||
      Buffer.byteLength(JSON.stringify(existing)) + Buffer.byteLength(content) >
        280000
    )
      throw new Error(
        "This workspace has reached its document storage limit. Remove a document first.",
      );
    const id = crypto.randomUUID();
    await storeDocument(owner, id, content);
    try {
      const chunks = await indexDocument(
        owner,
        id,
        title,
        content,
        request.signal,
      );
      const document = {
        id,
        title,
        content,
        chunks,
        createdAt: new Date().toISOString(),
        status: "indexed" as const,
      };
      await updateDocuments(owner, (docs) => [document, ...docs]);
      return NextResponse.json({ document }, { status: 201 });
    } catch (error) {
      await Promise.allSettled([
        removeDocument(owner, id),
        removeIndexedDocument(owner, id),
      ]);
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const { id } = z
      .object({ id: z.uuid() })
      .parse(await readJSON(request, 2000));
    const owner = await workspaceIdentity();
    const documents = await getDocuments(owner);
    if (!documents.some((document) => document.id === id))
      throw new Error("Document not found.");
    await removeIndexedDocument(owner, id);
    await removeDocument(owner, id);
    await updateDocuments(owner, (docs) =>
      docs.filter((document) => document.id !== id),
    );
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
