/**
 * Theme Map -- assigns default themes to each extension.
 * Import and call applyExtensionDefaults() in each extension's session_start.
 */

import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { fileURLToPath } from "url";

export const THEME_MAP: Record<string, string> = {
  "agent-chain":      "cyberpunk",
  "agent-team":       "tokyo-night",
  "chronicle":        "gruvbox",
  "damage-control":   "dracula",
  "minimal":          "dark-plus",
  "neutron":          "synthwave",
  "pi-pi":            "catppuccin-mocha",
  "subagent-widget":  "midnight-ocean",
  "theme-cycler":     "nord",
  "tilldone":         "everforest",
};

export function applyExtensionDefaults(importMetaUrl: string, ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  const filename = fileURLToPath(importMetaUrl);
  const base = filename.replace(/\.[tj]s$/, "").split(/[/\\]/).pop() || "";
  const mapped = THEME_MAP[base];
  if (!mapped) return;
  const current = ctx.ui.theme.name;
  if (current && current !== "default") return;
  ctx.ui.setTheme(mapped);
}
