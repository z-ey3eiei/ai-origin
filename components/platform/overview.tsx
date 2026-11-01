"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Button,
  FormControl,
  IconButton,
  Label,
  Select,
  Stack,
  Text,
  Heading,
} from "@primer/react";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  DownloadIcon,
  GlobeIcon,
  GraphIcon,
  NorthStarIcon,
  PlayIcon,
  PulseIcon,
  SyncIcon,
  ZapIcon,
} from "@primer/octicons-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useModels,
  useResources,
  useWorkspace,
  downloadFile,
} from "@/lib/client";
import {
  ArrowLink,
  EmptyState,
  ModelMark,
  PageTitle,
  SectionHeader,
  StatusBadge,
  Surface,
} from "./shared";

export function Overview() {
  const { data, mutate, isLoading } = useWorkspace();
  const { data: catalog, error: catalogError } = useModels();
  const { data: health } = useResources();
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState("requests");
  const turns = useMemo(
    () =>
      (data?.turns || []).filter(
        (turn) =>
          new Date(turn.createdAt).getTime() >= Date.now() - days * 86400000,
      ),
    [data?.turns, days],
  );
  const tokens = turns.reduce(
    (sum, turn) => sum + turn.inputTokens + turn.outputTokens,
    0,
  );
  const latencies = turns.filter((turn) => turn.ttftMs !== null);
  const ttft = latencies.length
    ? Math.round(
        latencies.reduce((sum, turn) => sum + (turn.ttftMs || 0), 0) /
          latencies.length,
      )
    : null;
  const success = turns.length
    ? (
        (turns.filter((turn) => turn.status === "success").length /
          turns.length) *
        100
      ).toFixed(1)
    : null;
  const chartData = useMemo(
    () =>
      Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - days + index + 1);
        const dayTurns = turns.filter(
          (turn) =>
            turn.createdAt.slice(0, 10) === date.toISOString().slice(0, 10),
        );
        return {
          date: date.toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }),
          requests: dayTurns.length,
          tokens: dayTurns.reduce(
            (sum, turn) => sum + turn.inputTokens + turn.outputTokens,
            0,
          ),
        };
      }),
    [turns, days],
  );
  const topModels = [...(catalog?.models || [])]
    .sort(
      (a, b) =>
        turns.filter((t) => t.modelId === b.id).length -
        turns.filter((t) => t.modelId === a.id).length,
    )
    .slice(0, 4);
  const statCards = [
    {
      label: "Total requests",
      value:
        isLoading || !data?.storage.connected
          ? "—"
          : turns.length.toLocaleString(),
      icon: GraphIcon,
      note: "Across all your models",
      tone: "blue",
    },
    {
      label: "Tokens processed",
      value:
        isLoading || !data?.storage.connected ? "—" : tokens.toLocaleString(),
      icon: ZapIcon,
      note: "Input + output tokens",
      tone: "purple",
    },
    {
      label: "Avg. time to first token",
      value: ttft === null ? "—" : `${ttft}`,
      unit: ttft === null ? "" : "ms",
      icon: ClockIcon,
      note: "Measured from your requests",
      tone: "amber",
    },
    {
      label: "Success rate",
      value: success === null ? "—" : `${success}`,
      unit: success === null ? "" : "%",
      icon: CheckCircleIcon,
      note: turns.length
        ? `${turns.filter((turn) => turn.status === "success").length} successful requests`
        : "Waiting for your first request",
      tone: "green",
    },
  ];

  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="YOUR DEVELOPER CONTROL CENTER"
        title="Workspace overview"
        description="A little clarity for everything you’re building with AI."
        action={
          <Stack direction="horizontal" gap="condensed">
            <Button as="a" href="/docs" leadingVisual={CodeIcon}>
              Quickstart
            </Button>
            <Button
              as="a"
              href="/playground"
              className="accent-button"
              trailingVisual={ArrowUpRightIcon}
            >
              Open playground
            </Button>
          </Stack>
        }
      />
      <section className="welcome-banner">
        <Stack direction="vertical" gap="normal" className="welcome-copy">
          <Stack direction="horizontal" gap="condensed" align="center">
            <span className="mini-star">
              <NorthStarIcon size={14} />
            </span>
            <Text className="welcome-eyebrow">
              FROM FIRST PROMPT TO PRODUCTION
            </Text>
          </Stack>
          <Heading as="h2">
            Your AI, in one place<span className="accent-text">.</span>
          </Heading>
          <Text className="muted">
            The models you love. The infrastructure you trust.
            <br />
            Build, compare, and ship something extraordinary.
          </Text>
          <Stack direction="horizontal" gap="normal" align="center">
            <Button
              as="a"
              href="/playground"
              className="accent-button"
              trailingVisual={ArrowRightIcon}
            >
              Start building
            </Button>
            <a href="/ecosystem" className="text-link">
              Tools &amp; projects <ArrowUpRightIcon size={14} />
            </a>
          </Stack>
        </Stack>
        <div className="brand-hero-visual" aria-hidden="true">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 0px, 48vw"
            src="/images/oneorigin-hero.jpg"
          />
        </div>
      </section>
      <Stack
        direction="horizontal"
        justify="space-between"
        align="center"
        gap="condensed"
        className="analytics-toolbar"
      >
        <Stack direction="horizontal" gap="condensed" align="center">
          <Heading as="h2" className="section-title">
            At a glance
          </Heading>
          <span className="subtle-divider" />
          <Text className="muted small-text">
            Your workspace, by the numbers
          </Text>
        </Stack>
        <Stack direction="horizontal" gap="condensed" align="center">
          <span className="live-label">
            <span
              className="status-dot"
              style={{
                background: data?.storage.connected
                  ? "var(--fgColor-success)"
                  : "var(--fgColor-attention)",
              }}
            />
            {data?.storage.connected ? "Live telemetry" : "Awaiting connection"}
          </span>
          <FormControl>
            <FormControl.Label visuallyHidden>
              Analytics period
            </FormControl.Label>
            <Select
              size="small"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <Select.Option value="7">Last 7 days</Select.Option>
              <Select.Option value="14">Last 14 days</Select.Option>
              <Select.Option value="30">Last 30 days</Select.Option>
            </Select>
          </FormControl>
          <IconButton
            size="small"
            variant="invisible"
            icon={SyncIcon}
            aria-label="Refresh analytics"
            onClick={() => mutate()}
          />
        </Stack>
      </Stack>
      <div className="metrics-grid">
        {statCards.map((stat) => (
          <Surface className="metric-card" key={stat.label}>
            <Stack
              direction="horizontal"
              justify="space-between"
              align="center"
              gap="condensed"
            >
              <Text className="muted small-text">{stat.label}</Text>
              <span className={`metric-icon ${stat.tone}`}>
                <stat.icon size={16} />
              </span>
            </Stack>
            <div className="metric-value">
              {stat.value}
              <span>{stat.unit}</span>
            </div>
            <Stack direction="horizontal" gap="condensed" align="center">
              <span className={`metric-tick ${stat.tone}`} />
              <Text className="muted tiny-text">{stat.note}</Text>
            </Stack>
          </Surface>
        ))}
      </div>
      <div className="dashboard-middle">
        <Surface className="traffic-card">
          <SectionHeader
            title="Request activity"
            description="Every interaction. A clearer picture."
            action={
              <Button
                size="small"
                variant="invisible"
                leadingVisual={DownloadIcon}
                onClick={() =>
                  downloadFile(
                    JSON.stringify(turns, null, 2),
                    "ai-origin-requests.json",
                  )
                }
              >
                Export
              </Button>
            }
          />
          <Stack
            direction="horizontal"
            justify="space-between"
            align="center"
            gap="normal"
            paddingInline="normal"
            className="chart-toolbar"
          >
            <div className="chart-tabs">
              <Button
                size="small"
                variant={tab === "requests" ? "default" : "invisible"}
                onClick={() => setTab("requests")}
              >
                Requests
              </Button>
              <Button
                size="small"
                variant={tab === "tokens" ? "default" : "invisible"}
                onClick={() => setTab("tokens")}
              >
                Tokens
              </Button>
            </div>
            <span className="chart-legend">
              <span />
              {tab === "requests" ? "Total requests" : "Total tokens"}
            </span>
          </Stack>
          <div className="traffic-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 18, right: 12, left: -26, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--fgColor-accent)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--fgColor-accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--borderColor-muted)"
                  vertical={false}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--fgColor-muted)", fontSize: 11 }}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--fgColor-muted)", fontSize: 11 }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bgColor-emphasis)",
                    border: "1px solid var(--borderColor-default)",
                    borderRadius: "var(--borderRadius-medium)",
                    color: "var(--fgColor-default)",
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey={tab}
                  stroke="var(--fgColor-accent)"
                  strokeWidth={2}
                  fill="url(#traffic-fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
            {!turns.length && (
              <div className="chart-empty-overlay">
                <span className="chart-empty-icon">
                  <PulseIcon size={22} />
                </span>
                <Text weight="semibold">
                  {data && !data.storage.connected
                    ? "Your workspace is taking shape"
                    : "Your next idea starts here"}
                </Text>
                <Text className="muted small-text">
                  {data && !data.storage.connected
                    ? "Connect Development resources to see your real activity."
                    : "Run a prompt to bring your activity to life."}
                </Text>
              </div>
            )}
          </div>
          <div className="chart-footnote">
            <span>
              <CalendarIcon size={12} /> Reporting in UTC
            </span>
            <span>Real usage. No sample data.</span>
          </div>
        </Surface>
        <Surface className="gateway-card">
          <SectionHeader
            title="Your AI stack"
            action={<CloudIcon size={17} />}
          />
          <div className="gateway-identity">
            <span className="gateway-symbol">
              <GlobeIcon size={26} />
            </span>
            <Stack direction="vertical" gap="tight">
              <Text weight="semibold">Connected infrastructure</Text>
              <Text className="muted small-text">AWS + Vercel AI Gateway</Text>
            </Stack>
          </div>
          <Stack
            direction="vertical"
            gap="none"
            paddingInline="normal"
            className="resource-list"
          >
            {(
              health?.resources || [
                {
                  id: "gateway",
                  name: "AI Gateway",
                  status: "unconfigured",
                  message: "Checking connection",
                },
                {
                  id: "dynamo",
                  name: "DynamoDB",
                  status: "unconfigured",
                  message: "Checking connection",
                },
                {
                  id: "s3",
                  name: "S3 storage",
                  status: "unconfigured",
                  message: "Checking connection",
                },
                {
                  id: "search",
                  name: "OpenSearch",
                  status: "unconfigured",
                  message: "Checking connection",
                },
              ]
            ).map((resource) => (
              <div className="resource-row" key={resource.id}>
                <span className="resource-name">
                  <span className={`resource-dot ${resource.status}`} />
                  {resource.name}
                </span>
                <Text
                  className={`tiny-text ${resource.status === "connected" ? "success-text" : "muted"}`}
                >
                  {resource.status === "connected"
                    ? "Connected"
                    : resource.status === "error"
                      ? "Check access"
                      : "Not configured"}
                </Text>
              </div>
            ))}
          </Stack>
          <div className="gateway-bottom">
            <span className="tiny-text muted">
              <CloudIcon size={14} /> IAM-first architecture
            </span>
            <Button
              as="a"
              href="/infrastructure"
              block
              size="small"
              trailingVisual={ArrowRightIcon}
            >
              View infrastructure
            </Button>
          </div>
        </Surface>
      </div>
      <div className="dashboard-bottom">
        <Surface>
          <SectionHeader
            title="Models at your fingertips"
            description="Find the right intelligence for your next idea."
            action={<ArrowLink href="/models">View catalog</ArrowLink>}
          />
          <div className="table-scroll">
            <table className="data-table model-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Requests</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {topModels.map((model) => (
                  <tr key={model.id}>
                    <td>
                      <span className="model-cell">
                        <ModelMark provider={model.provider} />
                        <span>
                          <strong>{model.name}</strong>
                          <span className="tiny-text muted">{model.id}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="provider-name">{model.provider}</span>
                    </td>
                    <td className="mono">
                      {turns.filter((t) => t.modelId === model.id).length}
                    </td>
                    <td>
                      <IconButton
                        as="a"
                        href={`/playground?model=${encodeURIComponent(model.id)}`}
                        icon={ArrowUpRightIcon}
                        aria-label={`Try ${model.name}`}
                        variant="invisible"
                        size="small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!topModels.length && (
              <div className="catalog-loading">
                <CpuIcon size={24} />
                <Text className="muted">
                  {catalogError
                    ? "The model catalog is temporarily unavailable. Refresh to retry."
                    : "Loading the live model catalog…"}
                </Text>
              </div>
            )}
          </div>
          <div className="table-footer">
            <span className="status-dot" />
            <Text className="tiny-text muted">
              {catalog
                ? `${catalog.total} models available through one gateway`
                : "Fetching available models from AI Gateway"}
            </Text>
          </div>
        </Surface>
        <Surface>
          <SectionHeader
            title="Make something great"
            description="Good tools. Better possibilities."
          />
          <div className="quick-action-list">
            {[
              {
                href: "/playground",
                title: "Compare your models",
                description: "One prompt. Two perspectives.",
                icon: PlayIcon,
                tone: "blue",
              },
              {
                href: "/knowledge",
                title: "Bring your own knowledge",
                description: "Give your AI a little context.",
                icon: DatabaseIcon,
                tone: "purple",
              },
              {
                href: "/generative",
                title: "Go beyond the chat",
                description: "Turn ideas into structured UI.",
                icon: NorthStarIcon,
                tone: "amber",
              },
            ].map((item) => (
              <a href={item.href} className="quick-action" key={item.href}>
                <span className={`quick-action-icon ${item.tone}`}>
                  <item.icon size={18} />
                </span>
                <span className="quick-action-copy">
                  <Text weight="semibold">{item.title}</Text>
                  <Text className="muted small-text">{item.description}</Text>
                </span>
                <ArrowUpRightIcon size={16} />
              </a>
            ))}
          </div>
          <div className="quick-action-footer">
            <span className="mini-star">
              <NorthStarIcon size={14} />
            </span>
            <Text className="tiny-text muted">Less setup. More building.</Text>
          </div>
        </Surface>
      </div>
    </Stack>
  );
}
