/**
 * Theme Cycler -- keyboard shortcuts to cycle through available themes.
 * Ctrl+X: cycle forward  |  Ctrl+Q: cycle backward
 * /theme: open picker    |  /theme <name>: switch directly
 * Usage: pi -e extensions/theme-cycler.ts
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { applyExtensionDefaults } from "./themeMap.ts";

export default function (pi: ExtensionAPI) {
  let swatchTimer: ReturnType<typeof setTimeout> | null = null;

  function updateStatus(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    ctx.ui.setStatus("theme", "theme: " + ctx.ui.theme.name);
  }

  function showSwatch(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    if (swatchTimer) { clearTimeout(swatchTimer); swatchTimer = null; }
    ctx.ui.setWidget("theme-swatch", (_tui, theme) => ({
      invalidate() {},
      render(width: number): string[] {
        const block = "\u2588\u2588\u2588";
        const swatch =
          theme.fg("success", block) + " " + theme.fg("accent", block) + " " +
          theme.fg("warning", block) + " " + theme.fg("dim", block);
        const label = theme.fg("accent", " theme: ") + theme.fg("muted", ctx.ui.theme.name) + "  " + swatch;
        const border = theme.fg("borderMuted", "\u2500".repeat(Math.max(0, width)));
        return [border, truncateToWidth("  " + label, width), border];
      },
    }), { placement: "belowEditor" });
    swatchTimer = setTimeout(() => { ctx.ui.setWidget("theme-swatch", undefined); swatchTimer = null; }, 3000);
  }

  function cycleTheme(ctx: ExtensionContext, direction: 1 | -1) {
    if (!ctx.hasUI) return;
    const themes = ctx.ui.getAllThemes();
    if (themes.length === 0) { ctx.ui.notify("No themes available", "warning"); return; }
    const current = ctx.ui.theme.name;
    let index = themes.findIndex((t) => t.name === current);
    if (index === -1) index = 0;
    index = (index + direction + themes.length) % themes.length;
    const theme = themes[index];
    const result = ctx.ui.setTheme(theme.name);
    if (result.success) { updateStatus(ctx); showSwatch(ctx); ctx.ui.notify(theme.name + " (" + (index + 1) + "/" + themes.length + ")", "info"); }
    else ctx.ui.notify("Failed to set theme: " + result.error, "error");
  }

  pi.registerShortcut("ctrl+x", {
    description: "Cycle theme forward",
    handler: async (ctx) => { cycleTheme(ctx, 1); },
  });

  pi.registerShortcut("ctrl+q", {
    description: "Cycle theme backward",
    handler: async (ctx) => { cycleTheme(ctx, -1); },
  });

  pi.registerCommand("theme", {
    description: "Select a theme: /theme or /theme <name>",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) return;
      const themes = ctx.ui.getAllThemes();
      const arg = args.trim();
      if (arg) {
        const result = ctx.ui.setTheme(arg);
        if (result.success) { updateStatus(ctx); showSwatch(ctx); ctx.ui.notify("Theme: " + arg, "info"); }
        else ctx.ui.notify("Theme not found: " + arg + ". Use /theme to browse.", "error");
        return;
      }
      const items = themes.map((t) => t.name + (t.name === ctx.ui.theme.name ? " (active)" : ""));
      const selected = await ctx.ui.select("Select Theme", items);
      if (!selected) return;
      const name = selected.split(" ")[0];
      const result = ctx.ui.setTheme(name);
      if (result.success) { updateStatus(ctx); showSwatch(ctx); ctx.ui.notify("Theme: " + name, "info"); }
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    updateStatus(ctx);
  });

  pi.on("session_shutdown", async () => {
    if (swatchTimer) { clearTimeout(swatchTimer); swatchTimer = null; }
  });
}
