import "server-only";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

const prefixes = {
  dynamo: "aws_one_ai_",
  s3: "awsoneorigin_",
  search: "awesomee_",
} as const;
export type AWSService = keyof typeof prefixes;

export function awsValue(service: AWSService, name: string) {
  return process.env[`${prefixes[service]}${name}`] || process.env[name];
}

export function awsConfig(service: AWSService) {
  const region = awsValue(service, "AWS_REGION") || "us-east-1";
  const roleArn = awsValue(service, "AWS_ROLE_ARN");
  return {
    region,
    credentials: roleArn
      ? awsCredentialsProvider({ roleArn, clientConfig: { region } })
      : fromNodeProviderChain(),
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
