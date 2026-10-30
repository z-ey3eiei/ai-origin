import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { awsConfig, awsValue, requireAWS } from "./config";
import {
  defaultSettings,
  type ChatTurn,
  type KnowledgeDocument,
  type WorkspaceSettings,
} from "@/lib/types";

function connection() {
  return {
    client: DynamoDBDocumentClient.from(
      new DynamoDBClient(awsConfig("dynamo")),
      { marshallOptions: { removeUndefinedValues: true } },
    ),
    table: requireAWS("dynamo", "DYNAMODB_TABLE_NAME"),
    pk: awsValue("dynamo", "DYNAMODB_TABLE_PARTITION_KEY") || "pk",
    sk: awsValue("dynamo", "DYNAMODB_TABLE_SORT_KEY"),
  };
}
function keyFor(owner: string, sort: string) {
  const { pk, sk } = connection();
  return sk
    ? { [pk]: `AIORIGIN#${owner}`, [sk]: sort }
    : { [pk]: `AIORIGIN#${owner}#${sort}` };
}
export async function putRecord(
  owner: string,
  sort: string,
  data: Record<string, unknown>,
) {
  const { client, table } = connection();
  await client.send(
    new PutCommand({
      TableName: table,
      Item: { ...data, ...keyFor(owner, sort) },
    }),
  );
}
export async function getRecord<T>(
  owner: string,
  sort: string,
): Promise<T | undefined> {
  const { client, table } = connection();
  const result = await client.send(
    new GetCommand({
      TableName: table,
      Key: keyFor(owner, sort),
      ConsistentRead: true,
    }),
  );
  return result.Item as T | undefined;
}
export async function deleteRecord(owner: string, sort: string) {
  const { client, table } = connection();
  await client.send(
    new DeleteCommand({ TableName: table, Key: keyFor(owner, sort) }),
  );
}
export async function getSettings(owner: string) {
  return {
    ...defaultSettings,
    ...(process.env.ORIGIN_INFERENCE_MODE === "bedrock"
      ? { defaultModel: "amazon/nova-pro" }
      : {}),
    ...(await getRecord<WorkspaceSettings>(owner, "SETTINGS")),
  };
}

export async function getTurns(owner: string): Promise<ChatTurn[]> {
  const { client, table, pk, sk } = connection();
  if (!sk)
    return (
      (await getRecord<{ turns: ChatTurn[] }>(owner, "HISTORY"))?.turns || []
    );
  const result = await client.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "#pk = :owner AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: { "#pk": pk, "#sk": sk },
      ExpressionAttributeValues: {
        ":owner": `AIORIGIN#${owner}`,
        ":prefix": "TURN#",
      },
      ScanIndexForward: false,
      Limit: 200,
      ConsistentRead: true,
    }),
  );
  return (result.Items || []) as ChatTurn[];
}
export async function saveTurn(owner: string, turn: ChatTurn) {
  const { client, table, sk } = connection();
  if (sk) {
    await putRecord(owner, `TURN#${turn.createdAt}#${turn.id}`, {
      ...turn,
      expiresAt: Math.floor(Date.now() / 1000) + 7776000,
    });
    return;
  }
  // Single-key integration tables keep a bounded history through optimistic concurrency.
  for (let attempt = 0; attempt < 5; attempt++) {
    const prior = await getRecord<{ turns: ChatTurn[]; version: number }>(
      owner,
      "HISTORY",
    );
    const version = prior?.version || 0;
    const turns = [
      turn,
      ...(prior?.turns || []).filter((item) => item.id !== turn.id),
    ].slice(0, 40);
    while (
      Buffer.byteLength(JSON.stringify(turns)) > 300000 &&
      turns.length > 1
    )
      turns.pop();
    try {
      await client.send(
        new PutCommand({
          TableName: table,
          Item: { ...keyFor(owner, "HISTORY"), turns, version: version + 1 },
          ConditionExpression: prior
            ? "#version = :version"
            : "attribute_not_exists(#version)",
          ExpressionAttributeNames: { "#version": "version" },
          ...(prior
            ? { ExpressionAttributeValues: { ":version": version } }
            : {}),
        }),
      );
      return;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "ConditionalCheckFailedException" ||
        attempt === 4
      )
        throw error;
    }
  }
}
export async function getDocuments(
  owner: string,
): Promise<KnowledgeDocument[]> {
  return (
    (await getRecord<{ documents: KnowledgeDocument[] }>(owner, "DOCUMENTS"))
      ?.documents || []
  );
}
export async function updateDocuments(
  owner: string,
  update: (docs: KnowledgeDocument[]) => KnowledgeDocument[],
) {
  const { client, table } = connection();
  for (let attempt = 0; attempt < 5; attempt++) {
    const prior = await getRecord<{
      documents: KnowledgeDocument[];
      version: number;
    }>(owner, "DOCUMENTS");
    const documents = update(prior?.documents || []);
    if (
      documents.length > 30 ||
      Buffer.byteLength(JSON.stringify(documents)) > 300000
    )
      throw new Error(
        "This workspace has reached its document storage limit. Remove a document before adding another.",
      );
    try {
      await client.send(
        new PutCommand({
          TableName: table,
          Item: {
            ...keyFor(owner, "DOCUMENTS"),
            documents,
            version: (prior?.version || 0) + 1,
          },
          ConditionExpression: prior ? "#v = :v" : "attribute_not_exists(#v)",
          ExpressionAttributeNames: { "#v": "version" },
          ...(prior
            ? { ExpressionAttributeValues: { ":v": prior.version } }
            : {}),
        }),
      );
      return documents;
    } catch (e) {
      if (
        !(e instanceof Error) ||
        e.name !== "ConditionalCheckFailedException" ||
        attempt === 4
      )
        throw e;
    }
  }
}
export async function consumeQuota(owner: string) {
  const { client, table } = connection();
  const day = new Date().toISOString().slice(0, 10);
  try {
    await client.send(
      new UpdateCommand({
        TableName: table,
        Key: keyFor(owner, `QUOTA#${day}`),
        UpdateExpression: "SET expiresAt = :ttl ADD #count :one",
        ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
        ExpressionAttributeNames: { "#count": "requestCount" },
        ExpressionAttributeValues: {
          ":ttl": Math.floor(Date.now() / 1000) + 172800,
          ":one": 1,
          ":limit": 100,
        },
      }),
    );
  } catch (e) {
    if (e instanceof Error && e.name === "ConditionalCheckFailedException")
      throw new Error(
        "Daily workspace limit reached (100 model requests). Please try again tomorrow.",
      );
    throw e;
  }
}
