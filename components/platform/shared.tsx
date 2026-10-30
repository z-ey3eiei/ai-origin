"use client";

import type { ReactNode } from "react";
import { Heading, Text, Stack, Label, Button, Flash } from "@primer/react";
import {
  ArrowUpRightIcon,
  NorthStarIcon,
  AlertIcon,
} from "@primer/octicons-react";

export function OriginMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`origin-mark ${small ? "small" : ""}`} aria-hidden="true">
      <NorthStarIcon size={small ? 16 : 24} />
    </span>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ narrow: "vertical", regular: "horizontal" }}
      justify="space-between"
      align={{ narrow: "start", regular: "center" }}
      gap="normal"
    >
      <Stack direction="vertical" gap="condensed">
        {eyebrow && <Text className="eyebrow">{eyebrow}</Text>}
        <Heading as="h1" className="page-title">
          {title}
        </Heading>
        <Text className="muted page-description">{description}</Text>
      </Stack>
      {action}
    </Stack>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`surface ${className}`}>{children}</section>;
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction="horizontal"
      justify="space-between"
      align="center"
      gap="normal"
      padding="normal"
      className="section-header"
    >
      <Stack direction="vertical" gap="tight">
        <Heading as="h2" className="section-title">
          {title}
        </Heading>
        {description && <Text className="muted small-text">{description}</Text>}
      </Stack>
      {action}
    </Stack>
  );
}

export function StatusBadge({
  status,
  children,
}: {
  status: "success" | "warning" | "neutral";
  children: ReactNode;
}) {
  return (
    <span className={`status-badge ${status}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}

export function EmptyState({
  icon = <NorthStarIcon size={28} />,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction="vertical"
      gap="normal"
      align="center"
      className="empty-state"
    >
      <span className="empty-icon">{icon}</span>
      <Stack direction="vertical" gap="condensed" align="center">
        <Heading as="h3" className="section-title">
          {title}
        </Heading>
        <Text className="muted empty-description">{description}</Text>
      </Stack>
      {action}
    </Stack>
  );
}

export function ModelMark({ provider }: { provider: string }) {
  const letter =
    provider === "anthropic"
      ? "A"
      : provider === "openai"
        ? "O"
        : provider === "google"
          ? "G"
          : "a";
  return (
    <span className={`model-mark ${provider}`} aria-hidden="true">
      {letter}
    </span>
  );
}

export function ErrorNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Flash variant="danger">
      <Stack direction="horizontal" gap="condensed" align="start">
        <AlertIcon />
        <Text>{message}</Text>
      </Stack>
    </Flash>
  );
}

export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      as="a"
      href={href}
      variant="invisible"
      size="small"
      trailingVisual={ArrowUpRightIcon}
    >
      {children}
    </Button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <Label>{children}</Label>;
}
