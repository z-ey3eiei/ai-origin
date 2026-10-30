import "server-only";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { embed, embedMany } from "ai";
import { awsConfig, awsValue, requireAWS } from "./config";

const indexName = "ai-origin-knowledge-v1";
export function searchClient() {
  const config = awsConfig("search");
  return new Client({
    ...AwsSigv4Signer({
      region: config.region,
      service: "aoss",
      getCredentials: config.credentials,
    }),
    node: requireAWS("search", "OPENSEARCH_ENDPOINT"),
    requestTimeout: 15000,
    maxRetries: 1,
  });
}
export function isVectorCollection() {
  return awsValue("search", "OPENSEARCH_COLLECTION_TYPE") === "VECTORSEARCH";
}
export async function ensureIndex() {
  const client = searchClient();
  if ((await client.indices.exists({ index: indexName })).body) return;
  const vector = isVectorCollection();
  try {
    await client.indices.create({
      index: indexName,
      body: {
        ...(vector ? { settings: { "index.knn": true } } : {}),
        mappings: {
          properties: {
            owner: { type: "keyword" },
            documentId: { type: "keyword" },
            title: { type: "text" },
            content: { type: "text" },
            ...(vector
              ? {
                  embedding: {
                    type: "knn_vector",
                    dimension: 1536,
                    method: {
                      name: "hnsw",
                      engine: "faiss",
                      space_type: "cosinesimil",
                    },
                  },
                }
              : {}),
          },
        },
      },
    });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("resource_already_exists_exception")
    )
      throw error;
  }
}
export function chunkText(content: string) {
  const chunks: string[] = [];
  for (let start = 0; start < content.length; start += 1600)
    chunks.push(content.slice(start, start + 2000));
  return chunks;
}
export async function indexDocument(
  owner: string,
  documentId: string,
  title: string,
  content: string,
  signal?: AbortSignal,
) {
  await ensureIndex();
  const chunks = chunkText(content);
  const vector = isVectorCollection();
  const embeddings = vector
    ? (
        await embedMany({
          model: "openai/text-embedding-3-small",
          values: chunks,
          abortSignal: signal,
          maxParallelCalls: 2,
          telemetry: { recordInputs: false, recordOutputs: false },
        })
      ).embeddings
    : [];
  const body = chunks.flatMap((chunk, index) => [
    { index: { _index: indexName } },
    {
      owner,
      documentId,
      title,
      content: chunk,
      ...(vector ? { embedding: embeddings[index] } : {}),
    },
  ]);
  const result = await searchClient().bulk({ body });
  if (result.body.errors)
    throw new Error(
      "Some passages could not be indexed. Please remove this document and retry.",
    );
  return chunks.length;
}
export async function retrieveKnowledge(
  owner: string,
  query: string,
  signal?: AbortSignal,
) {
  const client = searchClient();
  if (!(await client.indices.exists({ index: indexName })).body) return [];
  const vector = isVectorCollection();
  const embedding = vector
    ? (
        await embed({
          model: "openai/text-embedding-3-small",
          value: query,
          abortSignal: signal,
          telemetry: { recordInputs: false, recordOutputs: false },
        })
      ).embedding
    : null;
  const filter = { term: { owner } };
  const result = await client.search({
    index: indexName,
    body: {
      size: 5,
      _source: ["title", "content", "documentId"],
      query: embedding
        ? { knn: { embedding: { vector: embedding, k: 5, filter } } }
        : {
            bool: {
              filter: [filter],
              must: [
                { multi_match: { query, fields: ["content", "title^2"] } },
              ],
            },
          },
    },
  });
  return result.body.hits.hits.flatMap((hit) => {
    const source = hit._source as
      { title: string; content: string; documentId: string } | undefined;
    return source ? [{ ...source, score: hit._score || 0 }] : [];
  });
}
export async function removeIndexedDocument(owner: string, documentId: string) {
  const client = searchClient();
  if (!(await client.indices.exists({ index: indexName })).body) return;
  const result = await client.search({
    index: indexName,
    body: {
      size: 100,
      _source: false,
      query: {
        bool: { filter: [{ term: { owner } }, { term: { documentId } }] },
      },
    },
  });
  const hits = result.body.hits.hits as { _id: string }[];
  if (hits.length) {
    const result = await client.bulk({
      body: hits.map((hit) => ({
        delete: { _index: indexName, _id: hit._id },
      })),
    });
    if (result.body.errors)
      throw new Error(
        "The search index could not remove every passage. Please try again.",
      );
  }
}
