export const oneoriginWordmark =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_00000000a92882118bd443b4579d7747-1bY1Q3MuNcPh8kp2cDVuaxyQ2tt7kk.png";

export const ecosystem = {
  schemaVersion: 1,
  reviewedOn: "2026-10-31",
  scope:
    "Public entrypoints and repository metadata only; not an end-to-end or security audit.",
  productionApproval: "required",
  projects: [
    {
      id: "devstack",
      name: "DevStack",
      domain: "devstack.bid",
      role: "STACK BUILDER",
      description:
        "เลือก template จัดขั้นตอนติดตั้ง แล้วส่งออกสคริปต์ไปใช้กับโปรเจกต์จริง",
      website: "https://devstack.bid/",
      repository: "https://github.com/developer-devstack/devstack.bid",
      integration: "external-link",
      evidence:
        "Builder, Templates และ MCP discovery ตอบ HTTP 200 ในรอบตรวจนี้ ยังไม่ได้ทดสอบเรียก tools หรือสิทธิ์เข้าถึง",
      boundary:
        "เว็บไม่รันคำสั่งติดตั้งให้บนเซิร์ฟเวอร์ ผู้ใช้ต้องตรวจและรันสคริปต์เอง",
      links: [
        { label: "Open builder", url: "https://devstack.bid/builder" },
        { label: "Templates", url: "https://devstack.bid/templates" },
        { label: "MCP discovery", url: "https://devstack.bid/.well-known/mcp" },
      ],
    },
    {
      id: "aibotq",
      name: "Aibotq",
      domain: "aibotq.dev",
      role: "AGENT DELIVERY",
      description:
        "จุดเข้าแพลตฟอร์มสำหรับนำ repository หรือ template ไปสร้างและเผยแพร่ AI agent",
      website: "https://www.aibotq.dev/",
      repository: "https://github.com/developer-devstack/aibotq-site",
      integration: "external-link",
      evidence:
        "หน้าเว็บสาธารณะตอบ HTTP 200 ยังไม่ได้ทดสอบ GitHub login, build pipeline หรือ deploy แบบครบเส้นทาง",
      boundary:
        "ความสามารถบนหน้าแนะนำยังไม่ใช่หลักฐานว่า pipeline ใช้งานได้ครบ และราคา Pro / Team ยังไม่สรุป",
      links: [{ label: "Open Aibotq", url: "https://www.aibotq.dev/" }],
    },
    {
      id: "oneorigin",
      name: "ONEORIGIN",
      domain: "1origin.dev",
      role: "DEVELOPER PLATFORM",
      description:
        "พื้นที่รวม template และหน้าควบคุม Hosting ของ ONEORIGIN ที่มีอยู่แล้ว",
      website: "https://1origin.dev/",
      repository: "https://github.com/examplessdk-lgtm/one.origin",
      integration: "external-link",
      evidence:
        "หน้าแรกและ /hosting ตอบ HTTP 200 ข้อมูลสาธารณะระบุว่า Hosting ใช้บัญชี operator และจำกัด build worker เฉพาะโปรเจกต์ที่รองรับ",
      boundary:
        "Agent conversation เป็น scripted demo ไม่ใช่โมเดลหรือ terminal runtime ที่เชื่อมจริง",
      links: [
        { label: "Open ONEORIGIN", url: "https://1origin.dev/" },
        { label: "Hosting", url: "https://1origin.dev/hosting" },
      ],
    },
    {
      id: "ai-origin",
      name: "ai-origin",
      domain: "This workspace",
      role: "AI WORKSPACE",
      description:
        "โปรเจกต์ที่กำลังพัฒนารอบนี้: Playground, Knowledge, Request logs และ Infrastructure",
      website: "/",
      repository: "https://github.com/z-ey3eiei/ai-origin",
      integration: "current-workspace",
      evidence:
        "มีโค้ด API และหน้า workspace อยู่ใน repo นี้ ตรวจสถานะ provider จริงได้ที่ Infrastructure; การมีตัวแปรไม่ได้ยืนยันว่าสิทธิ์พร้อม",
      boundary:
        "ยังไม่รับรอง production: ต้องตรวจบัญชีผู้ใช้ การแยกข้อมูล สิทธิ์ AWS และ inference ให้ผ่านก่อน",
      links: [
        { label: "Open playground", url: "/playground" },
        { label: "Infrastructure", url: "/infrastructure" },
      ],
    },
  ],
  releaseGates: [
    {
      id: "identity",
      title: "บัญชีและการแยกข้อมูล",
      status: "not-verified",
      detail:
        "ทดสอบผู้ใช้สองบัญชีให้ไม่เห็นข้อมูลกัน หน้าแรกต้องเปิดได้โดยไม่บังคับ login; ขอ login ตอนส่ง chat และกลับ Home หลังเข้าใช้",
    },
    {
      id: "providers",
      title: "Provider และข้อมูลจริง",
      status: "not-verified",
      detail:
        "ยืนยัน AWS identity และ resource ที่ใช้จริง ทดสอบสิทธิ์อ่าน/เขียนใน environment ที่อนุมัติ และส่ง prompt จริงหนึ่งครั้ง",
    },
    {
      id: "connections",
      title: "เชื่อมทีละเส้นทาง",
      status: "not-verified",
      detail:
        "เริ่มจาก DevStack MCP: ตรวจ tool schema, authentication, timeout และผลลัพธ์จริงก่อนอนุญาตให้ agent เรียกใช้",
    },
    {
      id: "release",
      title: "อนุมัติก่อน production",
      status: "awaiting-user-approval",
      detail:
        "ตรวจ build, E2E, quota และ rollback ให้ครบ เก็บงานบน working branch ไม่ merge หรือ deploy production จนกว่าเจ้าของยืนยัน",
    },
  ],
} as const;
