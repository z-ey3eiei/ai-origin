import { NextResponse } from "next/server";
import { workspaceIdentity } from "@/lib/workspace-identity";
import { getDocuments, getSettings, getTurns } from "@/lib/aws/dynamo";
import { defaultSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export async function GET() {
  const owner = await workspaceIdentity();
  try {
    const [turns, documents, settings] = await Promise.all([
      getTurns(owner),
      getDocuments(owner),
      getSettings(owner),
    ]);
    return NextResponse.json(
      {
        turns,
        documents,
        settings,
        storage: {
          connected: true,
          message: "Your workspace is connected to DynamoDB.",
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message.includes("configuration is unavailable")
        ? error.message
        : "DynamoDB could not be reached. Check its connection on the Infrastructure page.";
    return NextResponse.json(
      {
        turns: [],
        documents: [],
        settings: defaultSettings,
        storage: { connected: false, message },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
