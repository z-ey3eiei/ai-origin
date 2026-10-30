import { NextResponse } from "next/server";
import { getModelCatalog } from "@/lib/ai/models";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    return NextResponse.json(await getModelCatalog());
  } catch (error) {
    return apiError(error);
  }
}
