"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  FormControl,
  Select,
  Stack,
  Text,
  Textarea,
  Spinner,
  IconButton,
} from "@primer/react";
import {
  CopyIcon,
  NorthStarIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  ZapIcon,
} from "@primer/octicons-react";
import { useModels, useWorkspace } from "@/lib/client";
import {
  ErrorNotice,
  ModelMark,
  PageTitle,
  StatusBadge,
  Surface,
} from "./shared";

type Result = {
  text: string;
  error: string;
  running: boolean;
  duration: number;
  ttft: number | null;
};
const emptyResult: Result = {
  text: "",
  error: "",
  running: false,
  duration: 0,
  ttft: null,
};

export function Playground() {
  const { data: catalog } = useModels();
  const { data, mutate } = useWorkspace();
  const [prompt, setPrompt] = useState("");
  const [modelA, setModelA] = useState("");
  useEffect(() => {
    const model = new URLSearchParams(window.location.search).get("model");
    if (model) setModelA(model);
  }, []);
  const [modelB, setModelB] = useState("openai/gpt-5.5");
  const [compare, setCompare] = useState(true);
  const [useKnowledge, setUseKnowledge] = useState(false);
  const [results, setResults] = useState<Result[]>([
    { ...emptyResult },
    { ...emptyResult },
  ]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const controllers = useRef<AbortController[]>([]);
  const running = results.some((result) => result.running);
  const activeModelA =
    modelA || data?.settings.defaultModel || "anthropic/claude-sonnet-5.5";
  const selectedModels = compare ? [activeModelA, modelB] : [activeModelA];
  const models = catalog?.models || [];

  async function run() {
    if (!prompt.trim() || running) return;
    controllers.current = selectedModels.map(() => new AbortController());
    setResults(selectedModels.map(() => ({ ...emptyResult, running: true })));
    await Promise.all(
      selectedModels.map(async (model, index) => {
        const start = performance.now();
        let text = "";
        let ttft: number | null = null;
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: prompt.trim(),
              modelId: model,
              sessionId,
              useKnowledge,
            }),
            signal: controllers.current[index].signal,
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Generation failed.");
          }
          if (!response.body)
            throw new Error("The model returned an empty stream.");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (ttft === null) ttft = Math.round(performance.now() - start);
            text += decoder.decode(value, { stream: true });
            setResults((current) =>
              current.map((result, i) =>
                i === index ? { ...result, text, ttft } : result,
              ),
            );
          }
          text += decoder.decode();
          setResults((current) =>
            current.map((result, i) =>
              i === index
                ? {
                    ...result,
                    text,
                    running: false,
                    duration: Math.round(performance.now() - start),
                    ttft,
                  }
                : result,
            ),
          );
        } catch (error) {
          const aborted = error instanceof Error && error.name === "AbortError";
          setResults((current) =>
            current.map((result, i) =>
              i === index
                ? {
                    ...result,
                    text,
                    running: false,
                    duration: Math.round(performance.now() - start),
                    error: aborted
                      ? "Generation stopped."
                      : error instanceof Error
                        ? error.message
                        : "Generation failed. Please try again.",
                  }
                : result,
            ),
          );
        }
      }),
    );
    mutate();
  }

  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="EXPLORE. COMPARE. ITERATE."
        title="The playground"
        description="One prompt, different perspectives. Find the model that thinks like you."
        action={
          <Button
            leadingVisual={TrashIcon}
            disabled={running}
            onClick={() => {
              setResults([{ ...emptyResult }, { ...emptyResult }]);
              setPrompt("");
              setSessionId(crypto.randomUUID());
            }}
          >
            New session
          </Button>
        }
      />
      {data && !data.storage.connected && (
        <ErrorNotice message={data.storage.message} />
      )}
      <Surface>
        <div className="playground-toolbar">
          <Stack direction="horizontal" gap="condensed" align="center">
            <NorthStarIcon className="accent-text" />
            <Text weight="semibold">Model workspace</Text>
          </Stack>
          <Stack direction="horizontal" gap="normal" align="center">
            <FormControl>
              <Checkbox
                checked={compare}
                disabled={running}
                onChange={(event) => setCompare(event.target.checked)}
              />
              <FormControl.Label>Compare models</FormControl.Label>
            </FormControl>
            <StatusBadge status="neutral">HTTP streaming</StatusBadge>
          </Stack>
        </div>
        <div className="playground-controls">
          {selectedModels.map((model, index) => (
            <FormControl key={index}>
              <FormControl.Label>
                {compare ? `Model ${index === 0 ? "A" : "B"}` : "Model"}
              </FormControl.Label>
              <Select
                block
                disabled={running}
                value={model}
                onChange={(event) =>
                  index === 0
                    ? setModelA(event.target.value)
                    : setModelB(event.target.value)
                }
              >
                {!models.some((item) => item.id === model) && (
                  <Select.Option value={model}>
                    {model.split("/").pop()}
                  </Select.Option>
                )}
                {models.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.name} · {item.provider}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          ))}
        </div>
        <div className={`comparison-grid ${compare ? "" : "single"}`}>
          {selectedModels.map((model, index) => {
            const result = results[index] || emptyResult;
            return (
              <section className="response-panel" key={index}>
                <div className="response-header">
                  <Stack direction="horizontal" gap="condensed" align="center">
                    <ModelMark provider={model.split("/")[0]} />
                    <Text weight="semibold">
                      {models.find((item) => item.id === model)?.name ||
                        model.split("/").pop()}
                    </Text>
                  </Stack>
                  {result.text && (
                    <IconButton
                      icon={CopyIcon}
                      aria-label={`Copy model ${index === 0 ? "A" : "B"} response`}
                      variant="invisible"
                      size="small"
                      onClick={() => navigator.clipboard.writeText(result.text)}
                    />
                  )}
                </div>
                <div
                  className="response-body"
                  role="log"
                  aria-label={`Response from ${model}`}
                  aria-live="polite"
                >
                  {result.text || (
                    <div className="response-waiting">
                      {result.running ? (
                        <Spinner size="medium" />
                      ) : (
                        <NorthStarIcon size={28} />
                      )}
                      <Text>
                        {result.running
                          ? "Thinking through your prompt…"
                          : "A fresh perspective is one prompt away."}
                      </Text>
                      <Text className="small-text">
                        {result.running
                          ? "Tokens will appear as they arrive."
                          : "Write something below to begin."}
                      </Text>
                    </div>
                  )}
                </div>
                {result.error && (
                  <div className="form-content">
                    <ErrorNotice message={result.error} />
                  </div>
                )}
                <div className="response-metrics">
                  <span>
                    <ZapIcon size={12} /> TTFT{" "}
                    {result.ttft === null ? "—" : `${result.ttft} ms`}
                  </span>
                  <span>
                    Total{" "}
                    {result.duration
                      ? `${(result.duration / 1000).toFixed(2)} s`
                      : "—"}
                  </span>
                  <span>
                    {result.running
                      ? "Streaming"
                      : result.text
                        ? "Completed"
                        : "Idle"}
                  </span>
                </div>
              </section>
            );
          })}
        </div>
        <div className="prompt-area">
          <FormControl>
            <FormControl.Label visuallyHidden>Your prompt</FormControl.Label>
            <Textarea
              block
              rows={3}
              value={prompt}
              disabled={running}
              maxLength={12000}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What are you building? Ask a question, explore an idea, or put a model to the test…"
              onKeyDown={(event) => {
                if (
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229
                )
                  return;
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  run();
                }
              }}
            />
          </FormControl>
          <div className="prompt-actions">
            <FormControl>
              <Checkbox
                checked={useKnowledge}
                onChange={(event) => setUseKnowledge(event.target.checked)}
              />
              <FormControl.Label>Use knowledge base</FormControl.Label>
            </FormControl>
            <Stack direction="horizontal" gap="normal" align="center">
              <Text className="muted tiny-text">⌘ / Ctrl + Enter to run</Text>
              {running ? (
                <Button
                  leadingVisual={StopIcon}
                  variant="danger"
                  onClick={() =>
                    controllers.current.forEach((controller) =>
                      controller.abort(),
                    )
                  }
                >
                  Stop generation
                </Button>
              ) : (
                <Button
                  className="accent-button"
                  leadingVisual={PlayIcon}
                  disabled={!prompt.trim()}
                  onClick={run}
                >
                  {compare ? "Run comparison" : "Run prompt"}
                </Button>
              )}
            </Stack>
          </div>
        </div>
      </Surface>
      <div className="prompt-suggestions">
        <Text className="muted small-text">A little inspiration</Text>
        {[
          "Design an AWS streaming architecture",
          "Explain RAG in simple terms",
          "Write a type-safe Next.js API",
        ].map((suggestion) => (
          <Button
            size="small"
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            disabled={running}
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <Text className="muted tiny-text">
        Responses are generated by real models. Requests and usage are saved to
        your browser-linked DynamoDB workspace. Closing or stopping a stream
        cancels downstream generation.
      </Text>
    </Stack>
  );
}
