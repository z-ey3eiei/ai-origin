import { NextResponse } from "next/server";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getRecord } from "@/lib/aws/dynamo";
import { s3Client } from "@/lib/aws/s3";
import { searchClient } from "@/lib/aws/search";
import { awsValue } from "@/lib/aws/config";
import { getModelCatalog } from "@/lib/ai/models";
import type { ResourceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export async function GET() {
  const checks = [
    {
      id: "gateway",
      name: "AI Gateway",
      description:
        "Unified multi-model inference through the Vercel AI Gateway.",
      configured: true,
      check: async () => {
        const catalog = await getModelCatalog();
        return `Catalog reachable · ${catalog.total} models listed. Inference availability is verified when you run a prompt.`;
      },
    },
    {
      id: "dynamo",
      name: "DynamoDB",
      description:
        "Server-side workspace settings, chat history, and usage telemetry.",
      configured: !!awsValue("dynamo", "DYNAMODB_TABLE_NAME"),
      check: async () => {
        await getRecord("health-check", "STATUS");
        return "Read access verified using short-lived IAM credentials.";
      },
    },
    {
      id: "s3",
      name: "S3 storage",
      description: "Private documents with workspace-scoped object keys.",
      configured: !!awsValue("s3", "S3_BUCKET_NAME"),
      check: async () => {
        await s3Client().send(
          new HeadBucketCommand({ Bucket: awsValue("s3", "S3_BUCKET_NAME") }),
        );
        return "Bucket access verified. All documents remain private.";
      },
    },
    {
      id: "search",
      name: "OpenSearch",
      description:
        "Knowledge indexing and retrieval, scoped to this workspace.",
      configured: !!awsValue("search", "OPENSEARCH_ENDPOINT"),
      check: async () => {
        await searchClient().indices.exists({
          index: "ai-origin-knowledge-v1",
        });
        return `${awsValue("search", "OPENSEARCH_COLLECTION_TYPE") === "VECTORSEARCH" ? "Vector" : "Full-text"} collection reachable. Index is created when you add your first document.`;
      },
    },
  ];
  const resources: ResourceStatus[] = await Promise.all(
    checks.map(async ({ configured, check, ...resource }) => {
      if (!configured)
        return {
          ...resource,
          status: "unconfigured" as const,
          message:
            "Runtime variables are not available. Confirm this integration is enabled for Development in project settings.",
        };
      try {
        return {
          ...resource,
          status: "connected" as const,
          message: await check(),
        };
      } catch {
        return {
          ...resource,
          status: "error" as const,
          message:
            "The live connection check did not succeed. Verify the integration configuration and its environment scope in project settings.",
        };
      }
    }),
  );
  return NextResponse.json(
    { resources },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
