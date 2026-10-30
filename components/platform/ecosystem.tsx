"use client";

import Image from "next/image";
import { Button, Heading, Label, Stack, Text } from "@primer/react";
import {
  ArrowUpRightIcon,
  CodeIcon,
  DownloadIcon,
  GlobeIcon,
  MarkGithubIcon,
  ShieldLockIcon,
} from "@primer/octicons-react";
import { ecosystem, oneoriginWordmark } from "@/lib/ecosystem";
import { downloadFile } from "@/lib/client";
import { PageTitle, SectionHeader, Surface } from "./shared";

function ProjectCard({
  project,
}: {
  project: (typeof ecosystem.projects)[number];
}) {
  const current = project.integration === "current-workspace";
  return (
    <article
      className="ecosystem-project"
      aria-labelledby={`project-${project.id}`}
    >
      <div className="ecosystem-project-heading">
        <span className="ecosystem-project-icon" aria-hidden="true">
          {current ? <CodeIcon size={22} /> : <GlobeIcon size={22} />}
        </span>
        <Label>{current ? "This workspace" : "External link"}</Label>
      </div>
      <Stack direction="vertical" gap="condensed">
        <Text className="eyebrow">{project.role}</Text>
        <Heading
          as="h2"
          id={`project-${project.id}`}
          className="ecosystem-project-title"
        >
          {project.name}
        </Heading>
        <Text className="muted small-text mono">{project.domain}</Text>
      </Stack>
      <Text className="ecosystem-project-description" lang="th">
        {project.description}
      </Text>
      <div className="ecosystem-evidence" lang="th">
        <Text weight="semibold" className="small-text">
          สิ่งที่ตรวจพบ
        </Text>
        <Text className="muted small-text">{project.evidence}</Text>
        <Text weight="semibold" className="small-text">
          ขอบเขตที่ต้องรู้
        </Text>
        <Text className="muted small-text">{project.boundary}</Text>
      </div>
      <div className="ecosystem-project-actions">
        {project.links.map((link, index) => {
          const external = link.url.startsWith("https://");
          return (
            <Button
              key={link.url}
              as="a"
              href={link.url}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              variant={index === 0 ? "default" : "invisible"}
              trailingVisual={external ? ArrowUpRightIcon : undefined}
              aria-label={
                external ? `${link.label} (opens in a new tab)` : undefined
              }
              size="small"
            >
              {link.label}
            </Button>
          );
        })}
      </div>
      <a
        className="ecosystem-repository muted small-text"
        href={project.repository}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.name} GitHub repository (opens in a new tab)`}
      >
        <MarkGithubIcon size={16} />
        <span>{project.repository.replace("https://github.com/", "")}</span>
        <ArrowUpRightIcon size={14} />
      </a>
    </article>
  );
}

export function Ecosystem() {
  return (
    <Stack direction="vertical" gap="spacious">
      <PageTitle
        eyebrow="YOUR EXISTING PLATFORMS"
        title="Tools & projects"
        description="เริ่มจากของที่มี ใช้หลักฐานจริง แล้วเชื่อมทีละส่วน"
        action={
          <Button
            leadingVisual={DownloadIcon}
            onClick={() =>
              downloadFile(
                JSON.stringify(ecosystem, null, 2),
                "oneorigin-ecosystem.json",
              )
            }
          >
            Export JSON
          </Button>
        }
      />
      <section className="ecosystem-intro" aria-label="ONEORIGIN ecosystem">
        <Image
          src={oneoriginWordmark}
          alt="ONEORIGIN"
          width={2172}
          height={724}
          sizes="(max-width: 760px) 90vw, 540px"
          unoptimized
          priority
          className="ecosystem-wordmark"
        />
        <div className="ecosystem-intro-copy" lang="th">
          <Label>Read-only review · {ecosystem.reviewedOn}</Label>
          <Text className="muted">
            รวมเว็บและ repo ของคุณไว้ในที่เดียว ลิงก์ภายนอกยังไม่ใช่การเชื่อม
            API และ HTTP 200 ยังไม่ยืนยันว่าระบบทำงานครบเส้นทาง
          </Text>
        </div>
      </section>
      <div className="ecosystem-project-grid">
        {ecosystem.projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <Surface>
        <SectionHeader
          title="Before production"
          description="รายการตรวจ ไม่ใช่ผลรับรองความพร้อม — ยังไม่มีข้อใดถูกทำเครื่องหมายว่าผ่าน"
          action={<ShieldLockIcon size={20} />}
        />
        <ol className="ecosystem-release-gates" lang="th">
          {ecosystem.releaseGates.map((gate, index) => (
            <li key={gate.id}>
              <span className="ecosystem-step" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Stack direction="vertical" gap="condensed">
                <Text weight="semibold">{gate.title}</Text>
                <Text className="muted small-text">{gate.detail}</Text>
                <Text className="ecosystem-gate-state small-text">
                  {gate.status === "awaiting-user-approval"
                    ? "รอเจ้าของยืนยัน"
                    : "ยังไม่ได้ตรวจยืนยัน"}
                </Text>
              </Stack>
            </li>
          ))}
        </ol>
        <div className="ecosystem-next-step" lang="th">
          <Stack direction="vertical" gap="condensed">
            <Text weight="semibold">
              ขั้นถัดไป: ยืนยัน identity และสิทธิ์ของ resource
            </Text>
            <Text className="muted small-text">
              ไม่สร้างบริการซ้ำ ไม่เปลี่ยน production
              และไม่ใช้ข้อมูลจำลองแทนผลจริง
            </Text>
          </Stack>
          <Button as="a" href="/infrastructure">
            ตรวจ Infrastructure
          </Button>
        </div>
      </Surface>
    </Stack>
  );
}
