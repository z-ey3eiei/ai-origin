"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionList,
  ActionMenu,
  Button,
  IconButton,
  Label,
  NavList,
  Stack,
  Text,
  TextInput,
  FormControl,
} from "@primer/react";
import { Dialog } from "@primer/react/experimental";
import {
  HomeIcon,
  PlayIcon,
  CpuIcon,
  DatabaseIcon,
  NorthStarIcon,
  RowsIcon,
  CloudIcon,
  GearIcon,
  BookIcon,
  SearchIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpRightIcon,
  ThreeBarsIcon,
  MarkGithubIcon,
  CommandPaletteIcon,
} from "@primer/octicons-react";
import type { Section } from "@/lib/types";
import { useModels, useWorkspace } from "@/lib/client";
import { OriginMark, StatusBadge } from "./shared";
import { Overview } from "./overview";
import { Playground } from "./playground";
import {
  ModelCatalog,
  KnowledgeBase,
  RequestLogs,
  Infrastructure,
  Settings,
  Documentation,
  GenerativeWorkspace,
} from "./workspace-pages";

const navigation = [
  { id: "overview", label: "Overview", icon: HomeIcon, href: "/" },
  {
    id: "playground",
    label: "Playground",
    icon: PlayIcon,
    href: "/playground",
  },
  { id: "models", label: "Model catalog", icon: CpuIcon, href: "/models" },
  {
    id: "knowledge",
    label: "Knowledge base",
    icon: DatabaseIcon,
    href: "/knowledge",
  },
  {
    id: "generative",
    label: "Generative UI",
    icon: NorthStarIcon,
    href: "/generative",
  },
  { id: "logs", label: "Request logs", icon: RowsIcon, href: "/logs" },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: CloudIcon,
    href: "/infrastructure",
  },
] as const;
const titles: Record<Section, string> = {
  overview: "Overview",
  playground: "Playground",
  models: "Model catalog",
  knowledge: "Knowledge base",
  generative: "Generative UI",
  logs: "Request logs",
  infrastructure: "Infrastructure",
  settings: "Settings",
  docs: "Documentation",
};

export function WorkspaceShell({ section }: { section: Section }) {
  const router = useRouter();
  const { data } = useWorkspace();
  const { data: catalog } = useModels();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const go = (href: string) => {
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(href);
  };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches.item(0);
    if (!touch || window.innerWidth > 760) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches.item(0);
    touchStartRef.current = null;
    if (!start || !touch || window.innerWidth > 760) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (
      !mobileOpen &&
      start.x <= 32 &&
      deltaX >= 72 &&
      Math.abs(deltaY) <= 44
    ) {
      setMobileOpen(true);
    }
  };
  const sidebar = (
    <>
      <a href="/" className="brand">
        <OriginMark />
        <span>
          ai<span className="brand-dash">—</span>origin
          <span className="brand-period">.</span>
        </span>
        <Label className="brand-label">BETA</Label>
      </a>
      <div className="workspace-switcher">
        <ActionMenu>
          <ActionMenu.Button block>
            <span className="workspace-avatar">O</span>
            {data?.settings.name || "Origin workspace"}
          </ActionMenu.Button>
          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Item onSelect={() => go("/settings")}>
                <ActionList.LeadingVisual>
                  <GearIcon />
                </ActionList.LeadingVisual>
                Workspace settings
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
        <Text className="workspace-plan">
          Developer workspace <span>Personal</span>
        </Text>
      </div>
      <Text className="nav-caption">WORKSPACE</Text>
      <NavList aria-label="Workspace navigation" className="main-navigation">
        {navigation.map((item) => (
          <NavList.Item
            key={item.id}
            href={item.href}
            aria-current={section === item.id ? "page" : undefined}
          >
            <NavList.LeadingVisual>
              <item.icon />
            </NavList.LeadingVisual>
            {item.label}
            {item.id === "generative" && (
              <NavList.TrailingVisual>
                <span className="new-tag">NEW</span>
              </NavList.TrailingVisual>
            )}
          </NavList.Item>
        ))}
      </NavList>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <CommandPaletteIcon size={20} />
          </span>
          <Text weight="semibold">Built for your next big idea.</Text>
          <Text className="muted small-text">
            One workspace. Every model.
            <br />
            Endless possibilities.
          </Text>
          <Button
            as="a"
            href="/docs"
            size="small"
            block
            trailingVisual={ArrowUpRightIcon}
          >
            Explore the docs
          </Button>
        </div>
        <NavList aria-label="Support navigation">
          <NavList.Item
            href="/docs"
            aria-current={section === "docs" ? "page" : undefined}
          >
            <NavList.LeadingVisual>
              <BookIcon />
            </NavList.LeadingVisual>
            Documentation
            <NavList.TrailingVisual>
              <ArrowUpRightIcon />
            </NavList.TrailingVisual>
          </NavList.Item>
          <NavList.Item
            href="/settings"
            aria-current={section === "settings" ? "page" : undefined}
          >
            <NavList.LeadingVisual>
              <GearIcon />
            </NavList.LeadingVisual>
            Settings
          </NavList.Item>
        </NavList>
        <a href="/settings" className="user-profile">
          <span className="profile-avatar">O</span>
          <Stack direction="vertical" gap="none">
            <Text weight="semibold">Origin developer</Text>
            <Text className="muted small-text">Browser-linked workspace</Text>
          </Stack>
          <ChevronDownIcon />
        </a>
      </div>
    </>
  );

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">{sidebar}</aside>
      <div className="workspace-main">
        <header className="topbar">
          <Stack direction="horizontal" gap="condensed" align="center">
            <span className="mobile-menu">
              <IconButton
                icon={ThreeBarsIcon}
                aria-label="Open navigation"
                variant="invisible"
                onClick={() => setMobileOpen(true)}
              />
            </span>
            <span className="breadcrumb-home">
              <HomeIcon size={16} />
            </span>
            <span className="breadcrumb-home">
              <ChevronRightIcon size={12} />
            </span>
            <Text className="topbar-title">{titles[section]}</Text>
          </Stack>
          <Stack direction="horizontal" gap="normal" align="center">
            <Button
              className="search-button"
              variant="invisible"
              leadingVisual={SearchIcon}
              onClick={() => setSearchOpen(true)}
            >
              Search anything… <kbd>⌘ K</kbd>
            </Button>
            <span className="topbar-divider" />
            <button
              type="button"
              className="environment-control"
              onClick={() => go("/infrastructure")}
              aria-label="Open Development infrastructure status"
            >
              <span className="status-dot" />
              <span>Development</span>
            </button>
            <IconButton
              icon={BellIcon}
              aria-label="Workspace activity"
              variant="invisible"
              onClick={() => setActivityOpen(true)}
            />
            <a
              href="/settings"
              className="top-avatar"
              aria-label="Open workspace settings"
            >
              O
            </a>
          </Stack>
        </header>
        <main id="main-content" className="page-content">
          {section === "overview" ? (
            <Overview />
          ) : section === "playground" ? (
            <Playground />
          ) : section === "models" ? (
            <ModelCatalog />
          ) : section === "knowledge" ? (
            <KnowledgeBase />
          ) : section === "generative" ? (
            <GenerativeWorkspace />
          ) : section === "logs" ? (
            <RequestLogs />
          ) : section === "infrastructure" ? (
            <Infrastructure />
          ) : section === "settings" ? (
            <Settings />
          ) : (
            <Documentation />
          )}
        </main>
        <nav className="mobile-dock" aria-label="Primary navigation">
          {navigation.slice(0, 3).map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={section === item.id ? "page" : undefined}
              className="mobile-dock-item"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </a>
          ))}
          <button
            type="button"
            className="mobile-dock-item"
            onClick={() => setMobileOpen(true)}
            aria-label="Open more workspace navigation"
          >
            <ThreeBarsIcon size={18} />
            <span>More</span>
          </button>
        </nav>
        <footer className="page-footer">
          <span>
            <span className="status-dot" /> AI Origin workspace
          </span>
          <Stack direction="horizontal" gap="normal">
            <Text>Built with Next.js · Powered by AWS</Text>
            <a
              href="https://github.com/z-ey3eiei/ai-origin"
              target="_blank"
              rel="noreferrer"
              aria-label="AI Origin on GitHub"
            >
              <MarkGithubIcon size={16} />
            </a>
            <Text className="version-label">v1.0.0</Text>
          </Stack>
        </footer>
      </div>
      {mobileOpen && (
        <Dialog
          title="AI Origin navigation"
          onClose={() => setMobileOpen(false)}
        >
          <NavList aria-label="Mobile navigation">
            {[
              ...navigation,
              {
                id: "settings",
                href: "/settings",
                label: "Settings",
                icon: GearIcon,
              },
              {
                id: "docs",
                href: "/docs",
                label: "Documentation",
                icon: BookIcon,
              },
            ].map((item) => (
              <NavList.Item
                key={item.id}
                href={item.href}
                aria-current={section === item.id ? "page" : undefined}
              >
                <NavList.LeadingVisual>
                  <item.icon />
                </NavList.LeadingVisual>
                {item.label}
              </NavList.Item>
            ))}
          </NavList>
        </Dialog>
      )}
      {searchOpen && (
        <Dialog
          title="Search your workspace"
          onClose={() => setSearchOpen(false)}
        >
          <Stack direction="vertical" gap="normal">
            <FormControl>
              <FormControl.Label visuallyHidden>
                Search pages and models
              </FormControl.Label>
              <TextInput
                autoFocus
                block
                leadingVisual={SearchIcon}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to a page or model…"
              />
            </FormControl>
            <ActionList aria-label="Search results">
              {navigation
                .filter((item) =>
                  item.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((item) => (
                  <ActionList.Item key={item.id} onSelect={() => go(item.href)}>
                    <ActionList.LeadingVisual>
                      <item.icon />
                    </ActionList.LeadingVisual>
                    {item.label}
                  </ActionList.Item>
                ))}
              {query &&
                catalog?.models
                  .filter((model) =>
                    model.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .slice(0, 5)
                  .map((model) => (
                    <ActionList.Item
                      key={model.id}
                      onSelect={() =>
                        go(`/playground?model=${encodeURIComponent(model.id)}`)
                      }
                    >
                      {model.name}
                      <ActionList.TrailingVisual>
                        <CpuIcon />
                      </ActionList.TrailingVisual>
                    </ActionList.Item>
                  ))}
            </ActionList>
          </Stack>
        </Dialog>
      )}
      {activityOpen && (
        <Dialog
          title="Workspace activity"
          subtitle="Your latest model requests"
          onClose={() => setActivityOpen(false)}
        >
          <Stack direction="vertical" gap="normal">
            {data?.turns.length ? (
              data.turns.slice(0, 6).map((turn) => (
                <Stack
                  key={turn.id}
                  direction="horizontal"
                  align="center"
                  justify="space-between"
                  gap="normal"
                >
                  <Text>{turn.modelId.split("/").pop()}</Text>
                  <StatusBadge
                    status={turn.status === "success" ? "success" : "warning"}
                  >
                    {turn.status}
                  </StatusBadge>
                </Stack>
              ))
            ) : (
              <Text className="muted">
                No activity yet. Run a prompt in the playground to start your
                request history.
              </Text>
            )}
          </Stack>
        </Dialog>
      )}
    </div>
  );
}
