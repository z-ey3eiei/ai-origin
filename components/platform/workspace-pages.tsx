"use client";

import { useState } from "react";
import {
  Button,
  FormControl,
  Heading,
  IconButton,
  Label,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  TextInput,
  Flash,
} from "@primer/react";
import { Dialog } from "@primer/react/experimental";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookIcon,
  CloudIcon,
  CodeIcon,
  CopyIcon,
  CpuIcon,
  DatabaseIcon,
  DownloadIcon,
  FileIcon,
  GlobeIcon,
  NorthStarIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  SyncIcon,
  TrashIcon,
  UploadIcon,
  ZapIcon,
} from "@primer/octicons-react";
import {
  defaultSettings,
  type KnowledgeDocument,
  type WorkspaceSettings,
} from "@/lib/types";
import {
  downloadFile,
  useModels,
  useResources,
  useWorkspace,
} from "@/lib/client";
import {
  EmptyState,
  ErrorNotice,
  ModelMark,
  PageTitle,
  SectionHeader,
  StatusBadge,
  Surface,
} from "./shared";

export function ModelCatalog() {
  const { data, error, isLoading } = useModels();
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const models = (data?.models || []).filter(
    (model) =>
      (provider === "all" || model.provider === provider) &&
      `${model.name} ${model.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="THE RIGHT MODEL FOR EVERY IDEA"
        title="A world of intelligence"
        description="Explore the live catalog. Compare capabilities. Find your perfect fit."
        action={<StatusBadge status="success">Live model catalog</StatusBadge>}
      />
      <div className="toolbar">
        <FormControl>
          <FormControl.Label visuallyHidden>Search models</FormControl.Label>
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leadingVisual={SearchIcon}
            placeholder="Search models…"
          />
        </FormControl>
        <FormControl>
          <FormControl.Label visuallyHidden>
            Filter by provider
          </FormControl.Label>
          <Select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <Select.Option value="all">All providers</Select.Option>
            {[...new Set(data?.models.map((model) => model.provider))].map(
              (name) => (
                <Select.Option key={name} value={name}>
                  {name}
                </Select.Option>
              ),
            )}
          </Select>
        </FormControl>
      </div>
      <ErrorNotice message={error?.message} />
      {isLoading && <Spinner />}
      <div className="model-grid">
        {models.map((model) => (
          <Surface className="catalog-card" key={model.id}>
            <Stack
              direction="horizontal"
              align="center"
              justify="space-between"
              gap="normal"
            >
              <ModelMark provider={model.provider} />
              <Label>{model.provider}</Label>
            </Stack>
            <Stack direction="vertical" gap="condensed">
              <Heading as="h2" className="section-title">
                {model.name}
              </Heading>
              <Text className="doc-id">{model.id}</Text>
            </Stack>
            <Text className="catalog-description">
              {model.description ||
                `Explore ${model.name} through the unified AI Origin gateway.`}
            </Text>
            <div className="catalog-stats">
              <span>
                Context window
                <strong>
                  {model.context
                    ? `${Math.round(model.context / 1000).toLocaleString()}K tokens`
                    : "Provider-defined"}
                </strong>
              </span>
              <span>
                Capability<strong>Text · Streaming</strong>
              </span>
            </div>
            <Button
              as="a"
              href={`/playground?model=${encodeURIComponent(model.id)}`}
              block
              trailingVisual={ArrowUpRightIcon}
            >
              Try in playground
            </Button>
          </Surface>
        ))}
      </div>
      {!isLoading && !error && !models.length && (
        <EmptyState
          icon={<SearchIcon size={24} />}
          title="No matching models"
          description="Try another search term or choose a different provider."
        />
      )}
    </Stack>
  );
}

export function KnowledgeBase() {
  const { data, mutate } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<KnowledgeDocument | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { title: string; content: string; score: number }[] | null
  >(null);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setOpen(false);
      setTitle("");
      setContent("");
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save document.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setSelected(null);
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete document.");
    } finally {
      setDeleting(false);
    }
  }
  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `/api/knowledge?q=${encodeURIComponent(query)}`,
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setResults(body.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="YOUR KNOWLEDGE. YOUR ADVANTAGE."
        title="Give your AI some context"
        description="Ground answers in your documents with AWS-backed retrieval."
        action={
          <Button
            className="accent-button"
            leadingVisual={PlusIcon}
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            Add knowledge
          </Button>
        }
      />
      <ErrorNotice message={open ? undefined : error} />
      <Surface>
        <SectionHeader
          title="Knowledge library"
          description={`${data?.documents.length || 0} documents · private to this workspace`}
          action={<DatabaseIcon className="accent-text" />}
        />
        {data?.documents.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Chunks</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.documents.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <span className="document-title">
                        <FileIcon className="accent-text" />
                        {document.title}
                      </span>
                    </td>
                    <td>{document.chunks}</td>
                    <td>
                      <StatusBadge
                        status={
                          document.status === "indexed" ? "success" : "neutral"
                        }
                      >
                        {document.status}
                      </StatusBadge>
                    </td>
                    <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="small"
                        variant="invisible"
                        onClick={() => {
                          setSelected(document);
                          setError("");
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<DatabaseIcon size={28} />}
            title="Great answers start with your knowledge"
            description="Add a text or Markdown document. We’ll store it privately in S3 and index its contents for retrieval."
            action={
              <Button leadingVisual={PlusIcon} onClick={() => setOpen(true)}>
                Add your first document
              </Button>
            }
          />
        )}
      </Surface>
      <Surface>
        <SectionHeader
          title="Test your retrieval"
          description="Find the most relevant passages before using them in a prompt."
        />
        <div className="form-content">
          <FormControl>
            <FormControl.Label>Ask your knowledge base</FormControl.Label>
            <TextInput
              block
              leadingVisual={SearchIcon}
              placeholder="What would you like to find?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229
                )
                  return;
                if (event.key === "Enter") search();
              }}
            />
          </FormControl>
          <div>
            <Button
              leadingVisual={SearchIcon}
              loading={searching}
              loadingAnnouncement="Searching knowledge"
              disabled={!query.trim()}
              onClick={search}
            >
              Search knowledge
            </Button>
          </div>
          {results &&
            (results.length ? (
              results.map((result, index) => (
                <div className="generated-node" key={index}>
                  <Text weight="semibold">{result.title}</Text>
                  <Text className="document-content">{result.content}</Text>
                </div>
              ))
            ) : (
              <Text className="muted">
                No relevant passages found. Try a different query.
              </Text>
            ))}
        </div>
      </Surface>
      {open && (
        <Dialog
          title="Add to your knowledge base"
          subtitle="Text and Markdown files, up to 80,000 characters."
          onClose={() => !saving && setOpen(false)}
          footerButtons={[
            {
              buttonType: "default",
              content: "Cancel",
              onClick: () => setOpen(false),
              disabled: saving,
            },
            {
              buttonType: "primary",
              content: saving ? "Indexing…" : "Save & index document",
              disabled: saving || !title.trim() || !content.trim(),
              onClick: save,
            },
          ]}
        >
          <Stack direction="vertical" gap="normal">
            <ErrorNotice message={error} />
            <FormControl>
              <FormControl.Label>Document title</FormControl.Label>
              <TextInput
                block
                value={title}
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Engineering handbook"
              />
            </FormControl>
            <FormControl>
              <FormControl.Label>Import a file</FormControl.Label>
              <TextInput
                type="file"
                accept=".txt,.md,.markdown"
                block
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 160000) {
                    setError("Please use a file smaller than 160 KB.");
                    return;
                  }
                  setTitle(file.name.replace(/\.[^.]+$/, ""));
                  setContent(await file.text());
                }}
              />
            </FormControl>
            <FormControl>
              <FormControl.Label>Content</FormControl.Label>
              <Textarea
                block
                rows={10}
                value={content}
                maxLength={80000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste your documentation, notes, or reference material…"
              />
            </FormControl>
          </Stack>
        </Dialog>
      )}
      {selected && (
        <Dialog
          title={selected.title}
          subtitle={`${selected.chunks} chunks · ${selected.status}`}
          onClose={() => setSelected(null)}
          footerButtons={[
            {
              buttonType: "danger",
              content: deleting ? "Deleting…" : "Delete document",
              disabled: deleting,
              onClick: remove,
            },
            {
              buttonType: "default",
              content: "Close",
              onClick: () => setSelected(null),
            },
          ]}
        >
          <ErrorNotice message={error} />
          <Text as="p" className="document-content">
            {selected.content}
          </Text>
        </Dialog>
      )}
    </Stack>
  );
}

export function RequestLogs() {
  const { data, mutate } = useWorkspace();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<
    NonNullable<typeof data>["turns"][number] | null
  >(null);
  const turns = (data?.turns || []).filter((turn) =>
    `${turn.modelId} ${turn.prompt} ${turn.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="NOTHING LOST IN THE BLACK BOX"
        title="Every request tells a story"
        description="Inspect real prompts, responses, latency, and token usage."
        action={
          <Button
            leadingVisual={DownloadIcon}
            onClick={() =>
              downloadFile(
                JSON.stringify(turns, null, 2),
                "ai-origin-request-logs.json",
              )
            }
          >
            Export logs
          </Button>
        }
      />
      <div className="toolbar">
        <FormControl>
          <FormControl.Label visuallyHidden>
            Search request logs
          </FormControl.Label>
          <TextInput
            leadingVisual={SearchIcon}
            placeholder="Filter by model, prompt, or status…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </FormControl>
        <Button leadingVisual={SyncIcon} onClick={() => mutate()}>
          Refresh
        </Button>
      </div>
      <Surface>
        {turns.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>TTFT</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {turns.map((turn) => (
                  <tr key={turn.id}>
                    <td>
                      <span className="model-cell">
                        <ModelMark provider={turn.modelId.split("/")[0]} />
                        {turn.modelId.split("/").pop()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          turn.status === "success" ? "success" : "warning"
                        }
                      >
                        {turn.status}
                      </StatusBadge>
                    </td>
                    <td className="mono">
                      {turn.inputTokens + turn.outputTokens}
                    </td>
                    <td className="mono">
                      {turn.ttftMs === null ? "—" : `${turn.ttftMs} ms`}
                    </td>
                    <td>{new Date(turn.createdAt).toLocaleString()}</td>
                    <td>
                      <Button
                        size="small"
                        variant="invisible"
                        onClick={() => setSelected(turn)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<CodeIcon size={28} />}
            title={
              query
                ? "No matching requests"
                : "Your request history starts here"
            }
            description={
              query
                ? "Try another model name or search term."
                : "Run your first prompt. Every request will appear here with real telemetry and its complete response."
            }
            action={
              <Button as="a" href="/playground" trailingVisual={ArrowRightIcon}>
                Open playground
              </Button>
            }
          />
        )}
      </Surface>
      {selected && (
        <Dialog
          title="Request details"
          subtitle={selected.modelId}
          onClose={() => setSelected(null)}
        >
          <Stack direction="vertical" gap="normal">
            <StatusBadge
              status={selected.status === "success" ? "success" : "warning"}
            >
              {selected.status}
            </StatusBadge>
            <Heading as="h3" className="section-title">
              Prompt
            </Heading>
            <Text className="document-content">{selected.prompt}</Text>
            <Heading as="h3" className="section-title">
              Response
            </Heading>
            <Text className="document-content">
              {selected.response || "No text was returned."}
            </Text>
            <Text className="muted small-text">
              Input: {selected.inputTokens} · Output: {selected.outputTokens} ·
              Duration: {selected.durationMs} ms
            </Text>
          </Stack>
        </Dialog>
      )}
    </Stack>
  );
}

export function Infrastructure() {
  const { data, mutate, isLoading } = useResources();
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="A LITTLE CLOSER TO THE METAL"
        title="Your foundation, in focus"
        description="Live connection checks. IAM-based credentials. AWS-native foundations."
        action={
          <Button
            leadingVisual={SyncIcon}
            loading={isLoading}
            loadingAnnouncement="Checking infrastructure"
            onClick={() => mutate()}
          >
            Check connections
          </Button>
        }
      />
      <Surface>
        <SectionHeader
          title="Request architecture"
          description="Streaming responses, without a buffering API Gateway in the middle."
        />
        <div className="architecture">
          {[
            { title: "Next.js", icon: CodeIcon },
            { title: "HTTP stream", icon: ZapIcon },
            { title: "AI Gateway", icon: GlobeIcon },
            { title: "AI models", icon: CpuIcon },
          ].map((node, index) => (
            <Stack
              direction="horizontal"
              gap="normal"
              align="center"
              key={node.title}
            >
              {index > 0 && <ArrowRightIcon className="muted" />}
              <div className="architecture-node">
                <node.icon size={24} />
                <Text>{node.title}</Text>
              </div>
            </Stack>
          ))}
        </div>
      </Surface>
      <div className="resource-grid">
        {data?.resources.map((resource) => (
          <Surface className="infrastructure-resource" key={resource.id}>
            <Stack
              direction="horizontal"
              align="center"
              justify="space-between"
              gap="normal"
            >
              <CloudIcon size={24} className="accent-text" />
              <StatusBadge
                status={
                  resource.status === "connected"
                    ? "success"
                    : resource.status === "error"
                      ? "warning"
                      : "neutral"
                }
              >
                {resource.status === "connected"
                  ? "Connected"
                  : resource.status === "error"
                    ? "Needs attention"
                    : "Not configured"}
              </StatusBadge>
            </Stack>
            <Heading as="h2" className="section-title">
              {resource.name}
            </Heading>
            <Text className="muted small-text">{resource.description}</Text>
            <Text className="small-text">{resource.message}</Text>
          </Surface>
        ))}
      </div>
      <Surface>
        <SectionHeader
          title="AWS deployment"
          description="Infrastructure as code lives in sst.config.ts. No resources are deployed automatically."
        />
        <div className="form-content">
          <Flash>
            <Text>
              The preview runs on Vercel. The SST configuration targets
              CloudFront and Lambda response streaming on your own AWS account.
              Deploying it provisions billable resources and requires your
              approval and AWS deployment identity.
            </Text>
          </Flash>
          <Stack direction="horizontal" gap="normal" wrap="wrap">
            <StatusBadge status="neutral">SST v3</StatusBadge>
            <StatusBadge status="neutral">CloudFront</StatusBadge>
            <StatusBadge status="neutral">Lambda streaming</StatusBadge>
            <StatusBadge status="neutral">DynamoDB + S3</StatusBadge>
            <StatusBadge status="neutral">IAM · no static keys</StatusBadge>
          </Stack>
          <Button as="a" href="/docs" trailingVisual={ArrowUpRightIcon}>
            Read the deployment guide
          </Button>
        </div>
      </Surface>
    </Stack>
  );
}

export function Settings() {
  const { data, mutate } = useWorkspace();
  const { data: catalog } = useModels();
  const [draft, setDraft] = useState<Partial<WorkspaceSettings>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const values = { ...defaultSettings, ...data?.settings, ...draft };
  function update(patch: Partial<WorkspaceSettings>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  }
  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await mutate();
      setSaved(true);
      setDraft({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your workspace, your way"
        description="The defaults that shape how you build."
      />
      <ErrorNotice message={error} />
      {saved && (
        <Flash variant="success">
          Your workspace settings have been saved to DynamoDB.
        </Flash>
      )}
      <Surface>
        <SectionHeader
          title="Workspace preferences"
          description="Changes are persisted on the server, not in local storage."
        />
        <div className="form-content">
          <FormControl>
            <FormControl.Label>Workspace name</FormControl.Label>
            <TextInput
              block
              maxLength={60}
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </FormControl>
          <div className="form-two-column">
            <FormControl>
              <FormControl.Label>Default model</FormControl.Label>
              <Select
                block
                value={values.defaultModel}
                onChange={(event) =>
                  update({ defaultModel: event.target.value })
                }
              >
                {!catalog?.models.some(
                  (model) => model.id === values.defaultModel,
                ) && (
                  <Select.Option value={values.defaultModel}>
                    {values.defaultModel}
                  </Select.Option>
                )}
                {catalog?.models.map((model) => (
                  <Select.Option key={model.id} value={model.id}>
                    {model.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormControl.Label>Maximum output tokens</FormControl.Label>
              <Select
                block
                value={values.maxOutputTokens}
                onChange={(event) =>
                  update({ maxOutputTokens: Number(event.target.value) })
                }
              >
                {[512, 1024, 2048, 4096].map((value) => (
                  <Select.Option key={value} value={String(value)}>
                    {value.toLocaleString()} tokens
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </div>
          <FormControl>
            <FormControl.Label>System instructions</FormControl.Label>
            <Textarea
              block
              rows={6}
              maxLength={8000}
              value={values.systemPrompt}
              onChange={(event) => update({ systemPrompt: event.target.value })}
            />
            <FormControl.Caption>
              Set the tone, expertise, and behavior of your playground
              assistant.
            </FormControl.Caption>
          </FormControl>
        </div>
        <div className="form-footer">
          <Text className="muted small-text">
            Applies to new model requests.
          </Text>
          <Button
            className="accent-button"
            loading={saving}
            loadingAnnouncement="Saving workspace settings"
            onClick={save}
          >
            Save changes
          </Button>
        </div>
      </Surface>
      <Surface>
        <SectionHeader title="Privacy & access" />
        <div className="form-content">
          <Stack direction="horizontal" align="center" gap="normal">
            <ShieldCheckIcon size={24} className="accent-text" />
            <Text className="muted">
              This is an anonymous, browser-linked workspace, not an
              authenticated team account. Its random, HttpOnly cookie scopes all
              reads and writes. Do not use it for sensitive or regulated data;
              clearing cookies loses access. Account sign-in is not part of this
              version.
            </Text>
          </Stack>
          <Button
            leadingVisual={DownloadIcon}
            onClick={() =>
              data &&
              downloadFile(
                JSON.stringify(data, null, 2),
                "ai-origin-workspace.json",
              )
            }
          >
            Export my workspace
          </Button>
        </div>
      </Surface>
    </Stack>
  );
}

type GeneratedUI = {
  title: string;
  summary: string;
  components: { name: string; service: string; description: string }[];
  steps: string[];
};
export function GenerativeWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [value, setValue] = useState<GeneratedUI | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showJSON, setShowJSON] = useState(false);
  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setValue(body.output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="IDEAS, GIVEN SHAPE"
        title="Beyond the conversation"
        description="Describe an architecture. Turn it into a structured, interactive plan."
      />
      <Surface>
        <div className="form-content">
          <FormControl>
            <FormControl.Label>What would you like to build?</FormControl.Label>
            <Textarea
              block
              rows={4}
              value={prompt}
              maxLength={4000}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A document Q&A platform with Next.js, private S3 uploads, vector retrieval, and streaming responses…"
            />
          </FormControl>
          <div>
            <Button
              className="accent-button"
              leadingVisual={NorthStarIcon}
              loading={generating}
              loadingAnnouncement="Generating your architecture"
              disabled={!prompt.trim()}
              onClick={generate}
            >
              Generate architecture
            </Button>
          </div>
          <ErrorNotice message={error} />
        </div>
      </Surface>
      {value ? (
        <Surface>
          <SectionHeader
            title="Your architecture"
            action={
              <Stack direction="horizontal" gap="condensed">
                <Button
                  size="small"
                  onClick={() => setShowJSON(!showJSON)}
                  leadingVisual={CodeIcon}
                >
                  {showJSON ? "Visual view" : "View JSON"}
                </Button>
                <IconButton
                  icon={DownloadIcon}
                  aria-label="Download generated architecture"
                  size="small"
                  onClick={() =>
                    downloadFile(
                      JSON.stringify(value, null, 2),
                      "ai-origin-architecture.json",
                    )
                  }
                />
              </Stack>
            }
          />
          <div className="form-content">
            {showJSON ? (
              <pre className="code-block">{JSON.stringify(value, null, 2)}</pre>
            ) : (
              <>
                <Heading as="h2" className="generated-heading">
                  {value.title}
                </Heading>
                <Text className="generated-description">{value.summary}</Text>
                <div className="resource-grid">
                  {value.components.map((component, index) => (
                    <div key={index} className="generated-node">
                      <Stack
                        direction="horizontal"
                        align="center"
                        justify="space-between"
                        gap="normal"
                      >
                        <CloudIcon className="accent-text" />
                        <Label>{component.service}</Label>
                      </Stack>
                      <Heading as="h3" className="section-title">
                        {component.name}
                      </Heading>
                      <Text className="muted small-text">
                        {component.description}
                      </Text>
                    </div>
                  ))}
                </div>
                <Heading as="h3" className="section-title">
                  Implementation path
                </Heading>
                {value.steps.map((step, index) => (
                  <Stack direction="horizontal" gap="normal" key={index}>
                    <Label>{index + 1}</Label>
                    <Text className="muted">{step}</Text>
                  </Stack>
                ))}
              </>
            )}
          </div>
        </Surface>
      ) : (
        <Surface>
          <EmptyState
            icon={<NorthStarIcon size={28} />}
            title="From a spark to a system"
            description="Generate a real AI-authored architecture with component cards, service choices, and implementation steps. No arbitrary generated code is executed."
          />
        </Surface>
      )}
    </Stack>
  );
}

export function Documentation() {
  const example = `const response = await fetch('/api/chat', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    prompt: 'Build something extraordinary.',\n    modelId: 'anthropic/claude-sonnet-5.5',\n    sessionId: crypto.randomUUID(),\n    useKnowledge: false\n  })\n});\n\nconst reader = response.body.getReader();\nconst decoder = new TextDecoder();\nwhile (true) {\n  const { done, value } = await reader.read();\n  if (done) break;\n  console.log(decoder.decode(value, { stream: true }));\n}`;
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="A GOOD PLACE TO START"
        title="Build with a little confidence"
        description="The essentials for your AI Origin workspace."
        action={
          <Button
            as="a"
            href="https://github.com/z-ey3eiei/ai-origin"
            target="_blank"
            rel="noreferrer"
            trailingVisual={ArrowUpRightIcon}
          >
            View source
          </Button>
        }
      />
      <div className="docs-grid">
        {[
          {
            title: "01 · Your first request",
            text: "Open the playground, choose a model, and write a prompt. Turn on comparison to stream two independent responses in parallel. Stop cancels the active downstream requests.",
            href: "/playground",
            icon: ZapIcon,
          },
          {
            title: "02 · Bring your context",
            text: "Add text or Markdown in the knowledge base. Documents are private in S3. OpenSearch indexes passages for retrieval; vector search is enabled only for vector collections.",
            href: "/knowledge",
            icon: DatabaseIcon,
          },
          {
            title: "03 · Understand your usage",
            text: "The overview and request logs use your actual DynamoDB records. Empty charts mean no usage has been recorded, not sample traffic. Export your records anytime.",
            href: "/logs",
            icon: CodeIcon,
          },
          {
            title: "04 · Know your infrastructure",
            text: "Check real service connections before publishing. Vercel uses short-lived OIDC credentials; AWS Lambda uses its execution role. No static AWS keys are stored.",
            href: "/infrastructure",
            icon: CloudIcon,
          },
        ].map((item) => (
          <Surface className="docs-card" key={item.href}>
            <item.icon size={24} className="accent-text" />
            <Heading as="h2" className="section-title">
              {item.title}
            </Heading>
            <p>{item.text}</p>
            <Button
              as="a"
              href={item.href}
              variant="invisible"
              trailingVisual={ArrowRightIcon}
            >
              Explore
            </Button>
          </Surface>
        ))}
      </div>
      <Surface>
        <SectionHeader
          title="Streaming API"
          description="Same-origin, cookie-scoped access. Not an unauthenticated public API key gateway."
          action={
            <IconButton
              size="small"
              icon={CopyIcon}
              aria-label="Copy streaming example"
              onClick={() => navigator.clipboard.writeText(example)}
            />
          }
        />
        <div className="form-content">
          <pre className="code-block">{example}</pre>
        </div>
      </Surface>
      <Surface>
        <SectionHeader title="Deployment notes" />
        <div className="form-content">
          <Text className="muted">
            The repository includes SST v3 infrastructure and a GitHub Actions
            validation workflow. The deployment workflow is manual and uses
            GitHub OIDC with an AWS deployment role. AWS-native deployment
            creates a new CloudFront/Lambda application, DynamoDB table, and S3
            bucket; it does not migrate existing preview data. Bedrock must be
            available to the execution role before selecting AWS-native
            inference. Aurora pgvector, Redis, Arcjet, Sentry, domain DNS, team
            authentication, and production load testing are not provisioned by
            this version.
          </Text>
          <Button
            as="a"
            href="https://sst.dev/docs/"
            target="_blank"
            rel="noreferrer"
            trailingVisual={ArrowUpRightIcon}
          >
            SST deployment documentation
          </Button>
        </div>
      </Surface>
    </Stack>
  );
}
