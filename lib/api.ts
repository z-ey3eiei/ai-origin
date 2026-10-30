import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function readJSON(request: Request, maximum = 200000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new Error("Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  const expected =
    /configuration is unavailable|Daily workspace|supported model|AWS-native|Cross-origin|too large|JSON|storage limit|not found|not configured|knowledge|document/i.test(
      message,
    );
  if (!expected)
    console.error(
      "[ai-origin] API request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
  return NextResponse.json(
    {
      error: expected
        ? message
        : "The connected service could not complete this request. Check its connection on the Infrastructure page and try again.",
    },
    {
      status: /Daily workspace/.test(message)
        ? 429
        : /Cross-origin/.test(message)
          ? 403
          : /not found/.test(message)
            ? 404
            : expected
              ? 400
              : 503,
    },
  );
}
