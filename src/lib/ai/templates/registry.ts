import { readFileSync } from "fs";
import { join } from "path";

export interface ModuleMarker {
  startMarker: string;
  endMarker: string;
}

export interface ModulesConfig {
  modules: Record<string, ModuleMarker>;
}

export interface LandingTemplateInfo {
  id: string;
  name: string;
  description: string;
  directory: string;
}

const TEMPLATES_DIR = join(process.cwd(), "src", "lib", "ai", "templates");

export const LANDING_TEMPLATES: LandingTemplateInfo[] = [
  {
    id: "minimal",
    name: "极简白",
    description: "大面积留白、精致排版、优雅克制",
    directory: "minimal",
  },
  {
    id: "tech",
    name: "科技深色",
    description: "深色背景、渐变光效、未来感",
    directory: "tech",
  },
  {
    id: "editorial",
    name: "杂志排版",
    description: "编辑风格、网格布局、图文混排",
    directory: "editorial",
  },
];

export function getTemplateById(id: string): LandingTemplateInfo | undefined {
  return LANDING_TEMPLATES.find((t) => t.id === id);
}

export function loadTemplateHtml(templateId: string): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`);
  }

  const htmlPath = join(TEMPLATES_DIR, template.directory, "template.html");
  return readFileSync(htmlPath, "utf-8");
}

export function loadModulesConfig(templateId: string): ModulesConfig {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`模板不存在: ${templateId}`);
  }

  const configPath = join(TEMPLATES_DIR, template.directory, "modules.json");
  const raw = readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as ModulesConfig;
}
