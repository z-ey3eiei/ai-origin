/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ai-origin",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      providers: { aws: { region: "us-east-1" } },
    };
  },
  async run() {
    const table = new sst.aws.Dynamo("AiOriginStore", {
      fields: { pk: "string", sk: "string" },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      ttl: "expiresAt",
      transform: {
        table: {
          pointInTimeRecovery: { enabled: true },
          deletionProtectionEnabled: $app.stage === "production",
        },
      },
    });
    const bucket = new sst.aws.Bucket("AiOriginAssets", {
      access: "cloudfront",
      cors: {
        allowOrigins: ["https://ai-origin.dev", "http://localhost:3000"],
        allowMethods: ["GET", "PUT", "HEAD"],
        allowHeaders: [
          "content-type",
          "content-length",
          "x-amz-server-side-encryption",
        ],
        maxAge: "5 minutes",
      },
    });
    const web = new sst.aws.Nextjs("AiOriginWeb", {
      link: [table, bucket],
      server: {
        memory: "2048 MB",
        runtime: "nodejs22.x",
        timeout: "5 minutes",
      },
      environment: {
        ORIGIN_INFERENCE_MODE: "bedrock",
        DYNAMODB_TABLE_NAME: table.name,
        DYNAMODB_TABLE_PARTITION_KEY: "pk",
        DYNAMODB_TABLE_SORT_KEY: "sk",
        S3_BUCKET_NAME: bucket.name,
        AWS_REGION: "us-east-1",
      },
      permissions: [
        {
          actions: [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream",
          ],
          resources: [
            "arn:aws:bedrock:*::foundation-model/amazon.nova*",
            "arn:aws:bedrock:*:*:inference-profile/us.amazon.nova*",
          ],
        },
      ],
      transform: {
        server(args) {
          args.streaming = true;
        },
      },
    });
    return { url: web.url, table: table.name, bucket: bucket.name };
  },
});
