import "server-only";
import {
  fromEnv,
  fromNodeProviderChain,
} from "@aws-sdk/credential-providers";

const prefixes = {
  dynamo: "aws_one_ai_",
  s3: "awsoneorigin_",
  search: "awesomee_",
} as const;
export type AWSService = keyof typeof prefixes;

export function awsValue(service: AWSService, name: string) {
  return process.env[`${prefixes[service]}${name}`] || process.env[name];
}

/**
 * Resolve AWS SDK client config for the current runtime.
 *
 * Cloudflare Workers / local: set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
 * (optional AWS_SESSION_TOKEN). Prefixed marketplace vars still work via awsValue.
 *
 * AWS Lambda / SST: falls back to the default credential provider chain
 * (execution role). Vercel OIDC (@vercel/functions/oidc) is intentionally
 * not used so the same code runs on Workers.
 */
export function awsConfig(service: AWSService) {
  const region = awsValue(service, "AWS_REGION") || "us-east-1";
  const hasStatic =
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY);
  return {
    region,
    credentials: hasStatic ? fromEnv() : fromNodeProviderChain(),
    maxAttempts: 2,
  };
}

export function requireAWS(service: AWSService, name: string) {
  const value = awsValue(service, name);
  if (!value)
    throw new Error(
      `${service === "dynamo" ? "DynamoDB" : service === "s3" ? "S3" : "OpenSearch"} is connected to the project, but its runtime configuration is unavailable. Check the integration’s Development environment variables in project settings.`,
    );
  return value;
}
