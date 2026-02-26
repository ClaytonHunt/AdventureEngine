/**
 * The Chronicle — State Machine Orchestrator (v2)
 *
 * A temporal orchestration extension for long-running, state-aware workflows.
 * Each workflow state is backed by a pre-defined agent (.pi/agents/*.md) that
 * can carry its own skills (.pi/skills/<name>/SKILL.md).
 *
 * Agent resolution order per state:
 *   1. state.agent  → resolves from .pi/agents/*.md (or agents/*.md)
 *   2. state.persona → inline persona string (backward-compatible fallback)
 *
 * Skills are loaded from:
 *   - Agent frontmatter:  skills: figma, design-system
 *   - State extra_skills: extra_skills: ["accessibility"]
 *   - Resolved paths:     .pi/skills/<name>/ or .pi/skills/<name>.md
 *
 * Workflow JSON format (state with agent reference):
 *   {
 *     "name": "Feature Implementation",
 *     "initial": "planning",
 *     "states": {
 *       "planning": {
 *         "description": "Architecture and planning",
 *         "agent": "planner",
 *         "extra_skills": ["design-system"],
 *         "next": ["implementation"],
 *         "requires_approval": false
 *       }
 *     }
 *   }
 *
 * Agent .md frontmatter (extended fields):
 *   ---
 *   name: ux-designer
 *   description: UX design specialist
 *   tools: read,bash,grep,find,ls
 *   skills: figma,design-system,accessibility
 *   model: anthropic/claude-sonnet-3-7   (optional)
 *   ---
 *   You are a UX Designer...
 *
 * Commands:
 *   /chronicle-start    — start a new workflow
 *   /chronicle-resume   — resume an interrupted session
 *   /chronicle-list     — list all sessions with status
 *   /chronicle-status   — show current ledger in detail
 *
 * Usage: pi -e extensions/chronicle.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import {
	readFileSync, writeFileSync, existsSync,
	mkdirSync, readdirSync, statSync, unlinkSync,
} from "fs";
import { join, resolve as resolvePath } from "path";
import { homedir, tmpdir } from "os";
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Agent Card Colors (pi-pi style) ───────────────────────────────────────────

const AGENT_COLORS: Record<string, { bg: string; br: string }> = {
	"scope-reviewer":        { bg: "\x1b[48;2;20;30;75m",  br: "\x1b[38;2;70;110;210m"  },
	"backlog-manager":       { bg: "\x1b[48;2;55;20;75m",  br: "\x1b[38;2;160;70;220m"  },
	"sprint-planner":        { bg: "\x1b[48;2;75;55;10m",  br: "\x1b[38;2;210;160;40m"  },
	"planner":               { bg: "\x1b[48;2;18;65;30m",  br: "\x1b[38;2;55;175;90m"   },
	"architect":             { bg: "\x1b[48;2;80;18;28m",  br: "\x1b[38;2;210;65;85m"   },
	"security-auditor":      { bg: "\x1b[48;2;50;22;85m",  br: "\x1b[38;2;145;80;220m"  },
	"performance-engineer":  { bg: "\x1b[48;2;80;55;12m",  br: "\x1b[38;2;215;150;40m"  },
	"ux-designer":           { bg: "\x1b[48;2;12;65;75m",  br: "\x1b[38;2;40;175;195m"  },
	"devops-engineer":       { bg: "\x1b[48;2;80;18;62m",  br: "\x1b[38;2;210;55;160m"  },
	"plan-reviewer":         { bg: "\x1b[48;2;28;42;80m",  br: "\x1b[38;2;85;120;210m"  },
	"builder":               { bg: "\x1b[48;2;60;80;20m",  br: "\x1b[38;2;160;210;55m"  },
	"red-team":              { bg: "\x1b[48;2;90;15;15m",  br: "\x1b[38;2;230;60;60m"   },
	"reviewer":              { bg: "\x1b[48;2;20;60;20m",  br: "\x1b[38;2;80;200;80m"   },
	"git-ops":               { bg: "\x1b[48;2;70;40;10m",  br: "\x1b[38;2;200;130;40m"  },
	"tech-writer":           { bg: "\x1b[48;2;20;55;70m",  br: "\x1b[38;2;60;175;210m"  },
	"documenter":            { bg: "\x1b[48;2;20;60;55m",  br: "\x1b[38;2;55;185;165m"  },
	"scout":                 { bg: "\x1b[48;2;65;35;10m",  br: "\x1b[38;2;190;110;40m"  },
};
const FG_RESET = "\x1b[39m";
const BG_RESET = "\x1b[49m";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Extended agent definition — parsed from .pi/agents/*.md frontmatter */
interface AgentDef {
	name: string;
	description: string;
	tools: string;
	skills: string[];     // skill names to auto-load (from frontmatter `skills:` field)
	model?: string;       // optional model override (from frontmatter `model:` field)
	systemPrompt: string; // markdown body below frontmatter
	file: string;
}

/** A single workflow state definition */
interface WorkflowState {
	description: string;
	agent?: string;
	persona?: string;
	tools?: string;
	extra_skills?: string[];
	next: string[];
	requires_approval?: boolean;   // pre-run human gate (fires before agent)
	approval_mode?: "pre" | "post"; // "post" = run agent first, gate on verdict
	timeout_minutes?: number;
}

interface WorkflowDef {
	name: string;
	description?: string;
	initial: string;
	states: Record<string, WorkflowState>;
}

interface StateRecord {
	state: string;
	agentName: string;    // which agent ran this state
	modelUsed?: string;   // provider/model used for this run
	startedAt: number;
	completedAt?: number;
	summary: string;
	tokensUsed: number;
	elapsed: number;
	taskGiven: string;
	outputPreview: string;
	exitCode?: number;    // 0 = success, non-zero = error, undefined = legacy record
}

interface Snapshot {
	modifiedFiles: string[];
	keyFindings: string[];
	pendingTasks: string[];
	custom: Record<string, any>;
}

interface Ledger {
	id: string;
	workflowName: string;
	workflowPath: string;
	workflowDef: WorkflowDef;
	created: number;
	lastUpdated: number;
	currentState: string;
	currentStateTask: string;   // task given to the currently-running agent (persisted for resume)
	initialTask: string;
	history: StateRecord[];
	snapshot: Snapshot;
	transitionCounts: Record<string, number>;
	totalTokens: number;
	totalElapsed: number;
	status: "running" | "done" | "paused" | "human_intervention";
}

// ── Project Settings ─────────────────────────────────────────────────────────

interface ProjectSettings {
	project: {
		name?: string;
		description?: string;
		language?: string;
		framework?: string;
		runtime?: string;
	};
	architecture?: {
		pattern?: string;  // clean, mvc, hexagonal, layered, microservices, etc.
		notes?: string;
	};
	development?: {
		tdd?: boolean;
		styleGuide?: string;
		linter?: string;
		formatter?: string;
	};
	testing?: {
		framework?: string;  // vitest, jest, pytest, mocha, etc.
		e2e?: string;        // playwright, cypress, etc.
		coverageThreshold?: number;
		testFilePattern?: string;
	};
	git?: {
		commitStyle?: string;    // conventional, angular, gitmoji, etc.
		branchStrategy?: string; // trunk, gitflow, github-flow, etc.
		defaultBranch?: string;
		requirePR?: boolean;
	};
	skills?: {
		always?: string[];   // skill names always loaded for every sub-agent
		auto?: boolean;      // auto-map settings → skills
	};
	chronicle?: {
		artifacts?: {
			backlog_path?: string;
			sprint_plan_path?: string;
			reports_dir?: string;
			temp_dir?: string;
		};
	};
}

/** Load .pi/project.json — returns null if missing or invalid */
function loadProjectSettings(cwd: string): ProjectSettings | null {
	const p = join(cwd, ".pi", "project.json");
	if (!existsSync(p)) return null;
	try {
		const raw = readFileSync(p, "utf-8");
		// Strip _comment fields before parsing
		const cleaned = raw.replace(/"_comment[^"]*"\s*:\s*"[^"]*",?\n?/g, "");
		return JSON.parse(cleaned) as ProjectSettings;
	} catch {
		return null;
	}
}

function resolveChronicleArtifacts(settings: ProjectSettings | null | undefined) {
	const a = settings?.chronicle?.artifacts;
	return {
		backlogPath: a?.backlog_path || ".pi/chronicle/backlog.json",
		sprintPlanPath: a?.sprint_plan_path || ".pi/chronicle/sprint-plan.md",
		reportsDir: a?.reports_dir || ".pi/chronicle/artifacts/reports",
		tempDir: a?.temp_dir || ".pi/chronicle/artifacts/tmp",
	};
}

/**
 * Render project settings as a system prompt block injected into every sub-agent.
 * Gives agents the project context they need to make the right decisions.
 */
function buildProjectSettingsBlock(settings: ProjectSettings): string {
	const lines: string[] = ["## Project Settings"];

	const p = settings.project;
	if (p) {
		const parts = [
			p.name && `**Project:** ${p.name}`,
			p.description && `**Description:** ${p.description}`,
			p.language && `**Language:** ${p.language}`,
			p.framework && `**Framework:** ${p.framework}`,
			p.runtime && `**Runtime:** ${p.runtime}`,
		].filter(Boolean) as string[];
		if (parts.length) lines.push(...parts);
	}

	const arch = settings.architecture;
	if (arch?.pattern) {
		lines.push(`**Architecture:** ${arch.pattern}${arch.notes ? ` — ${arch.notes}` : ""}`);
	}

	const dev = settings.development;
	if (dev) {
		if (dev.tdd) lines.push("**TDD:** enabled — write tests BEFORE implementation code");
		if (dev.styleGuide) lines.push(`**Style Guide:** ${dev.styleGuide}`);
		if (dev.linter) lines.push(`**Linter:** ${dev.linter}`);
		if (dev.formatter) lines.push(`**Formatter:** ${dev.formatter}`);
	}

	const test = settings.testing;
	if (test) {
		const parts = [
			test.framework && `framework: ${test.framework}`,
			test.e2e && `e2e: ${test.e2e}`,
			test.coverageThreshold !== undefined && `coverage threshold: ${test.coverageThreshold}%`,
			test.testFilePattern && `pattern: ${test.testFilePattern}`,
		].filter(Boolean);
		if (parts.length) lines.push(`**Testing:** ${parts.join(", ")}`);
	}

	const git = settings.git;
	if (git) {
		const parts = [
			git.commitStyle && `commit style: ${git.commitStyle}`,
			git.branchStrategy && `branch strategy: ${git.branchStrategy}`,
			git.defaultBranch && `default branch: ${git.defaultBranch}`,
			git.requirePR && "PRs required",
		].filter(Boolean);
		if (parts.length) lines.push(`**Git:** ${parts.join(", ")}`);
	}

	const paths = resolveChronicleArtifacts(settings);
	lines.push("**Chronicle Artifacts (canonical paths):**");
	lines.push(`- backlog: ${paths.backlogPath}`);
	lines.push(`- sprint plan: ${paths.sprintPlanPath}`);
	lines.push(`- reports: ${paths.reportsDir}`);
	lines.push(`- temp: ${paths.tempDir}`);
	lines.push("**File policy:** Never create duplicate backlog/sprint files elsewhere. Non-application reports/scripts must be written only under reports/temp directories above.");

	return lines.join("\n");
}

/**
 * Auto-map project settings to skill names.
 * Only returns names for skills that actually exist on disk.
 */
function resolveAutoSkills(settings: ProjectSettings, cwd: string): string[] {
	if (!settings.skills?.auto) return [];

	const candidates: string[] = [];

	// TDD
	if (settings.development?.tdd) candidates.push("tdd");

	// Testing framework
	const tf = settings.testing?.framework;
	if (tf) candidates.push(tf); // vitest, jest, pytest, mocha, etc.

	// E2E framework
	const e2e = settings.testing?.e2e;
	if (e2e) candidates.push(e2e); // playwright, cypress, etc.

	// Git commit style
	const cs = settings.git?.commitStyle;
	if (cs === "conventional" || cs === "angular") candidates.push("conventional-commits");

	// Architecture pattern — look for "<pattern>-architecture" skill
	const arch = settings.architecture?.pattern;
	if (arch) candidates.push(`${arch}-architecture`);

	// Only return skills that actually exist
	return candidates.filter(name => {
		const projectPath = join(cwd, ".pi", "skills", name);
		const userPath = join(homedir(), ".pi", "skills", name);
		const projectMd = join(cwd, ".pi", "skills", `${name}.md`);
		const userMd = join(homedir(), ".pi", "skills", `${name}.md`);
		return existsSync(projectPath) || existsSync(userPath) ||
			existsSync(projectMd) || existsSync(userMd);
	});
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
	return Math.random().toString(16).slice(2, 10) +
		Math.random().toString(16).slice(2, 10);
}

function displayName(raw: string): string {
	return raw.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmtElapsed(ms: number): string {
	if (ms < 60000) return `${Math.round(ms / 1000)}s`;
	return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`;
}

// ── Agent File Parsing ────────────────────────────────────────────────────────

function parseAgentFile(filePath: string): AgentDef | null {
	try {
		const raw = readFileSync(filePath, "utf-8")
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const fm: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!fm.name) return null;

		// Parse skills — comma-separated list in frontmatter
		const skillsRaw = fm.skills || "";
		const skills = skillsRaw
			.split(",")
			.map(s => s.trim())
			.filter(Boolean);

		return {
			name: fm.name,
			description: fm.description || "",
			tools: fm.tools || "read,grep,find,ls",
			skills,
			model: fm.model || undefined,
			systemPrompt: match[2].trim(),
			file: filePath,
		};
	} catch {
		return null;
	}
}

function scanAgentDirs(cwd: string): Map<string, AgentDef> {
	const dirs = [
		join(cwd, "agents"),
		join(cwd, ".claude", "agents"),
		join(cwd, ".pi", "agents"),
	];
	const agents = new Map<string, AgentDef>();
	for (const dir of dirs) {
		if (!existsSync(dir)) continue;
		try {
			for (const file of readdirSync(dir)) {
				if (!file.endsWith(".md")) continue;
				// Skip subdirectories (e.g. .pi/agents/pi-pi/)
				const fullPath = resolvePath(dir, file);
				try {
					if (statSync(fullPath).isDirectory()) continue;
				} catch { continue; }
				const def = parseAgentFile(fullPath);
				if (def && !agents.has(def.name.toLowerCase())) {
					agents.set(def.name.toLowerCase(), def);
				}
			}
		} catch {}
	}
	return agents;
}

// ── Skill Path Resolution ─────────────────────────────────────────────────────

/**
 * Resolve skill names to absolute paths that can be passed to `--skill`.
 * Search order per skill name:
 *   1. <projectRoot>/.pi/skills/<name>/   (directory with SKILL.md)
 *   2. <projectRoot>/.pi/skills/<name>.md (single file)
 *   3. ~/.pi/skills/<name>/
 *   4. ~/.pi/skills/<name>.md
 */
function resolveSkillPaths(skillNames: string[], cwd: string): string[] {
	const resolved: string[] = [];
	const projectSkillsDir = join(cwd, ".pi", "skills");
	const userSkillsDir = join(homedir(), ".pi", "skills");

	for (const name of skillNames) {
		let found = false;
		const candidates = [
			join(projectSkillsDir, name),
			join(projectSkillsDir, `${name}.md`),
			join(userSkillsDir, name),
			join(userSkillsDir, `${name}.md`),
		];
		for (const candidate of candidates) {
			if (existsSync(candidate)) {
				resolved.push(candidate);
				found = true;
				break;
			}
		}
		if (!found) {
			// Warn but don't crash — skill simply won't be available
			console.warn(`[chronicle] skill not found: "${name}"`);
		}
	}
	return resolved;
}

// ── Ledger Persistence ────────────────────────────────────────────────────────

function ledgerPath(sessDir: string, id: string): string {
	return join(sessDir, `${id}.json`);
}

function saveLedger(sessDir: string, ledger: Ledger): void {
	ledger.lastUpdated = Date.now();
	writeFileSync(ledgerPath(sessDir, ledger.id), JSON.stringify(ledger, null, 2), "utf-8");
}

function loadLedger(sessDir: string, id: string): Ledger | null {
	const p = ledgerPath(sessDir, id);
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, "utf-8")) as Ledger;
	} catch {
		return null;
	}
}

function listLedgers(sessDir: string): Ledger[] {
	if (!existsSync(sessDir)) return [];
	const ledgers: Ledger[] = [];
	try {
		for (const f of readdirSync(sessDir)) {
			if (!f.endsWith(".json")) continue;
			const id = f.slice(0, -5);
			const l = loadLedger(sessDir, id);
			if (l) ledgers.push(l);
		}
	} catch {}
	return ledgers.sort((a, b) => b.lastUpdated - a.lastUpdated);
}

// ── Workflow Loader ───────────────────────────────────────────────────────────

function loadWorkflows(workflowDir: string): WorkflowDef[] {
	if (!existsSync(workflowDir)) return [];
	const defs: WorkflowDef[] = [];
	try {
		for (const f of readdirSync(workflowDir)) {
			if (!f.endsWith(".json")) continue;
			try {
				const raw = readFileSync(join(workflowDir, f), "utf-8");
				const def = JSON.parse(raw) as WorkflowDef;
				if (def.name && def.initial && def.states) defs.push(def);
			} catch {}
		}
	} catch {}
	return defs;
}

// ── Context Block Builder ─────────────────────────────────────────────────────

function sanitizeHandoverText(text: string): string {
	return text
		.replace(/reply exactly:\s*\*\*proceed with tool execution now\.\*\*/ig, "[removed repetitive approval-loop phrase]")
		.replace(/please send(?: exactly)?:?\s*\*\*"?proceed with tool execution now\.?"?\*\*/ig, "[removed repetitive approval-loop phrase]")
		.replace(/to continue properly,\s*send:?\s*\*\*proceed with tool execution now\.\*\*/ig, "[removed repetitive approval-loop phrase]")
		.trim();
}

function buildContextBlock(ledger: Ledger): string {
	const lines: string[] = [];

	if (ledger.history.length > 0) {
		lines.push("## Workflow History");
		const recentHistory = ledger.history.slice(-12); // prevent runaway context anchoring
		for (const h of recentHistory) {
			const elapsed = h.elapsed ? ` (${fmtElapsed(h.elapsed)})` : "";
			const agent = h.agentName ? ` [${displayName(h.agentName)}]` : "";
			lines.push(`### State: ${displayName(h.state)}${agent}${elapsed}`);
			lines.push(`**Task:** ${sanitizeHandoverText(h.taskGiven || "")}`);
			lines.push(`**Summary:** ${sanitizeHandoverText(h.summary || "")}`);
			lines.push("");
		}
	}

	const snap = ledger.snapshot;
	if (snap.keyFindings.length > 0) {
		lines.push("## Key Findings (carried from previous states)");
		for (const f of snap.keyFindings) lines.push(`- ${f}`);
		lines.push("");
	}
	if (snap.modifiedFiles.length > 0) {
		lines.push("## Modified Files (this workflow)");
		for (const f of snap.modifiedFiles) lines.push(`- ${f}`);
		lines.push("");
	}
	if (snap.pendingTasks.length > 0) {
		lines.push("## Pending Tasks (handed over from previous states)");
		for (const t of snap.pendingTasks) lines.push(`- ${t}`);
		lines.push("");
	}
	if (Object.keys(snap.custom).length > 0) {
		lines.push("## Additional Context");
		lines.push("```json");
		lines.push(JSON.stringify(snap.custom, null, 2));
		lines.push("```");
		lines.push("");
	}

	return lines.join("\n");
}

// ── Verdict Detection ─────────────────────────────────────────────────────────
// Detects APPROVE / BLOCK verdicts from reviewer agents.
// Used by approval_mode:"post" states (e.g. plan-approval) to decide whether
// to show a human confirmation dialog or surface a block for the supervisor.
//
// IMPORTANT: avoid global keyword scans — they cause false BLOCKs when prompts
// include both words (e.g. instructions or examples). Prefer a dedicated
// `Verdict: APPROVE|BLOCK` line and only then use conservative fallbacks.

function isExecutionApprovalLoop(output: string): boolean {
	return /proceed with tool execution now|explicit execution approval|cannot provide that truthfully without running commands|please send exactly\s*:?\s*\*\*"?proceed with tool execution now/i.test(output);
}

function detectVerdict(output: string): { verdict: "approve" | "block"; source: string } {
	const text = output.replace(/\r\n/g, "\n");

	// 1) Primary parser: explicit Verdict line (last one wins)
	// Accepts markdown variants like:
	//   Verdict: APPROVE
	//   **Verdict:** BLOCK
	//   - Verdict: approve
	const verdictLineRe = /^\s{0,3}(?:[-*]\s*)?(?:\*\*)?\s*verdict\s*(?:\*\*)?\s*:\s*(?:\*\*)?\s*(approve|block)\b.*$/gim;
	let m: RegExpExecArray | null;
	let last: "approve" | "block" | null = null;
	while ((m = verdictLineRe.exec(text)) !== null) {
		last = m[1].toLowerCase() as "approve" | "block";
	}
	if (last) return { verdict: last, source: "verdict-line" };

	// 2) Secondary parser: `### Verdict` section only (not whole document)
	const verdictSection = text.match(/(^|\n)\s{0,3}#{1,6}\s*verdict\b[\s\S]*?(?=\n\s{0,3}#{1,6}\s+\S|\s*$)/i)?.[0] || "";
	if (verdictSection) {
		const hasApprove = /✅|\bapprove\b|\bapproved\b|\bready to (ship|implement|proceed)\b/i.test(verdictSection);
		const hasBlock = /⛔|🔴|\bblock\b|\bdo not ship\b|\bdo not proceed\b|\bcorrections required\b/i.test(verdictSection);
		if (hasApprove && !hasBlock) return { verdict: "approve", source: "verdict-section" };
		if (hasBlock && !hasApprove) return { verdict: "block", source: "verdict-section" };
		if (hasApprove && hasBlock) return { verdict: "block", source: "verdict-section-ambiguous" };
	}

	// 3) Last-resort fallback: conservative block
	return { verdict: "block", source: "fallback" };
}

// ── Sub-Agent Spawner ─────────────────────────────────────────────────────────

interface SpawnResult {
	output: string;
	exitCode: number;
	elapsed: number;
	tokensUsed: number;
}

interface ResolvedStateAgent {
	tools: string;
	agentPersona: string;     // agent identity — goes to --system-prompt (replaces pi default)
	workflowContext: string;  // task + history — goes to --append-system-prompt (file-based)
	skillPaths: string[];
	modelOverride?: string;
	agentName: string;
	cwd: string;              // project root — used to locate chronicle-ask.ts
}

interface AgentQuestion {
	question: string;
	options: string[];
	allowFreeText: boolean;
}

/**
 * Resolve a workflow state to a concrete agent configuration.
 * Priority: agent reference > inline persona > defaults.
 * Project settings are always injected as an additional context block.
 */
function resolveStateAgent(
	stateDef: WorkflowState,
	stateName: string,
	ledger: Ledger,
	task: string,
	allAgents: Map<string, AgentDef>,
	cwd: string,
	projectSettings: ProjectSettings | null,
	projectSkillNames: string[],
): ResolvedStateAgent {
	const contextBlock = buildContextBlock(ledger);

	// Project settings block — always injected so agents know project conventions
	const settingsBlock = projectSettings
		? buildProjectSettingsBlock(projectSettings)
		: "";

	const workflowContext = [
		settingsBlock,
		`## Workflow: ${ledger.workflowName} — State: ${displayName(stateName)}`,
		`**Role:** ${stateDef.description}`,
		"",
		contextBlock,
		"## Your Task",
		task,
		"",
		"## When You Are Done",
		"End your response with a clear summary of:",
		"- What you accomplished",
		"- Key findings or decisions made",
		"- Files created or modified (if any)",
		"- Recommendations or blockers for the next step",
	].join("\n");

	// Agent-based state (v2)
	if (stateDef.agent) {
		const agentDef = allAgents.get(stateDef.agent.toLowerCase());
		const allSkillNames = [
			...projectSkillNames,                    // project-level (always first)
			...(agentDef?.skills || []),             // agent's own skills
			...(stateDef.extra_skills || []),        // state-level additions
		];
		const skillPaths = resolveSkillPaths(allSkillNames, cwd);

		if (agentDef) {
			return {
				tools: agentDef.tools,
				agentPersona: agentDef.systemPrompt,
				workflowContext,
				skillPaths,
				modelOverride: agentDef.model,
				agentName: agentDef.name,
				cwd,
			};
		}
		// Agent name given but file not found — warn and fall through with defaults
		console.warn(`[chronicle] agent "${stateDef.agent}" not found — using defaults`);
		return {
			tools: "read,grep,find,ls",
			agentPersona: "",
			workflowContext,
			skillPaths,
			agentName: stateDef.agent,
			cwd,
		};
	}

	// Inline persona fallback (v1, backward-compatible)
	const personaText = stateDef.persona || "";
	const allSkillNames = [
		...projectSkillNames,                // project-level
		...(stateDef.extra_skills || []),
	];
	return {
		tools: stateDef.tools || "read,grep,find,ls",
		agentPersona: personaText,
		workflowContext,
		skillPaths: resolveSkillPaths(allSkillNames, cwd),
		agentName: "(inline)",
		cwd,
	};
}

function spawnStateAgent(
	resolved: ResolvedStateAgent,
	model: string,
	sessDir: string,
	stateKey: string,
	ledgerId: string,
	timeoutMs: number,
	onProgress: (text: string) => void,
	onSpawn: (proc: ReturnType<typeof spawn>) => void,
	onQuestion: (q: AgentQuestion) => Promise<string>,
): Promise<SpawnResult> {
	// Write the workflow context (task + history + project settings) to a file.
	//
	// WHY FILE: pi --help says --append-system-prompt accepts "text or file
	// contents". Passing raw text fails on Windows because pi.cmd forwards args
	// via %* inside a compound "endLocal & ... %*" line — shell metacharacters
	// in the text (&, >, |, ^) are interpreted as operators, silently truncating
	// the arg. A clean file path has none of those characters.
	//
	// The agent persona goes to --system-prompt (replaces pi's default coding-
	// assistant prompt with the agent's identity). Since we bypass pi.cmd via
	// direct node spawn (shell: false), inline text is safe there regardless
	// of content.
	const contextFile = join(sessDir, `ctx-${ledgerId}-${stateKey}.md`);
	writeFileSync(contextFile, resolved.workflowContext, "utf-8");

	const effectiveModel = resolved.modelOverride || model;

	const chronicleAskExt = join(resolved.cwd, "extensions", "chronicle-ask.ts");
	const args: string[] = [
		"--mode", "json",
		"-p",
		"--no-extensions",
		"-e", chronicleAskExt,      // ask_supervisor tool for this agent
		"--model", effectiveModel,
		"--tools", resolved.tools,
		"--thinking", "off",
		// Agent persona replaces pi's default system prompt
		...(resolved.agentPersona ? ["--system-prompt", resolved.agentPersona] : []),
		// Workflow context (task, history, project settings) appended from file
		"--append-system-prompt", contextFile,
		// Stateless per-run execution avoids stale conversational loops.
		"--no-session",
		...resolved.skillPaths.flatMap(p => ["--skill", p]),
		// The task lives in the context file, but we still give a direct trigger
		// in the user turn so the model doesn't stall waiting for extra approval.
		"Execute the task now. You are explicitly authorized to run the required tools in this workspace. Do not ask for additional approval.",
	];

	// Spawn node directly with pi's cli.js — bypasses pi/pi.cmd and cmd.exe.
	//
	// process.execPath = absolute path to the node/bun binary running Pi now
	// process.argv[1]  = absolute path to pi's cli.js in the running process
	// shell: false     = args array reaches node directly, zero shell parsing
	const piCli = process.argv[1];
	const nodeBin = process.execPath;

	const textChunks: string[] = [];
	const stderrChunks: string[] = [];
	const startTime = Date.now();
	let tokensUsed = 0;

	return new Promise((resolve) => {
		const proc = spawn(nodeBin, [piCli, ...args], {
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				// Chronicle IPC — picked up by chronicle-ask.ts in the sub-agent
				CHRONICLE_SESS_DIR:  sessDir,
				CHRONICLE_LEDGER_ID: ledgerId,
				CHRONICLE_STATE:     stateKey,
			},
		});

		// Expose proc so /chronicle-kill can abort it
		onSpawn(proc);

		// Hard timeout — kills the subprocess if it hasn't exited naturally.
		// Sub-agents can run bash; without this, a hanging command (dev server,
		// interactive test runner, etc.) stalls the workflow indefinitely.
		let timedOut = false;
		const killTimer = setTimeout(() => {
			timedOut = true;
			try { proc.kill("SIGTERM"); } catch {}
			setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 5000);
		}, timeoutMs);

		let buffer = "";

		let questionInFlight = false;   // serialize concurrent questions

		proc.stdout!.setEncoding("utf-8");
		proc.stdout!.on("data", (chunk: string) => {
			buffer += chunk;
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";
			for (const line of lines) {
				if (!line.trim()) continue;

				// ── Agent question IPC ──────────────────────────────────────────
				// chronicle-ask.ts writes __CQ__:<base64-json> when an agent calls
				// ask_supervisor().  We intercept it before JSON.parse so it never
				// ends up in the catch block.
				if (line.startsWith("__CQ__:") && !questionInFlight) {
					questionInFlight = true;
					const b64 = line.slice("__CQ__:".length);
					let agentQuestion: AgentQuestion = { question: "", options: [], allowFreeText: true };
					try {
						agentQuestion = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
					} catch {}

					// Fire async — the agent subprocess polls for the answer file
					// while we await the user's selection.
					(async () => {
						try {
							const answer = await onQuestion(agentQuestion);
							const answerFile = join(sessDir, `answer-${ledgerId}-${stateKey}.json`);
							writeFileSync(answerFile, JSON.stringify({ answer }), "utf-8");
						} finally {
							questionInFlight = false;
						}
					})().catch(() => { questionInFlight = false; });
					continue;
				}

				try {
					const event = JSON.parse(line);
					if (event.type === "message_update") {
						const delta = event.assistantMessageEvent;
						if (delta?.type === "text_delta") {
							const piece = delta.delta || "";
							textChunks.push(piece);
							const full = textChunks.join("");
							const last = full.split("\n").filter((l: string) => l.trim()).pop() || "";
							onProgress(last);
						}
					} else if (event.type === "message_end") {
						const usage = event.message?.usage;
						if (usage) tokensUsed = (usage.input || 0) + (usage.output || 0);
					} else if (event.type === "agent_end") {
						const msgs: any[] = event.messages || [];
						const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
						if (last?.usage) tokensUsed = (last.usage.input || 0) + (last.usage.output || 0);
					}
				} catch {}
			}
		});

		proc.stderr!.setEncoding("utf-8");
		proc.stderr!.on("data", (chunk: string) => stderrChunks.push(chunk));

		proc.on("close", (code) => {
			clearTimeout(killTimer);
			onSpawn(null as any); // clear the external ref
			try { unlinkSync(contextFile); } catch {}

			if (buffer.trim()) {
				try {
					const event = JSON.parse(buffer);
					if (event.type === "message_update") {
						const delta = event.assistantMessageEvent;
						if (delta?.type === "text_delta") textChunks.push(delta.delta || "");
					}
				} catch {}
			}

			const fullOutput = textChunks.join("");
			const stderr = stderrChunks.join("").trim();
			const timeoutNote = timedOut
				? `\n\n⏱ Agent timed out after ${Math.round(timeoutMs / 60000)} minutes and was killed. Partial output above.`
				: "";
			resolve({
				output: (fullOutput || (code !== 0 && stderr ? `[exit ${code}] ${stderr}` : "")) + timeoutNote,
				exitCode: timedOut ? 124 : (code ?? 1),
				elapsed: Date.now() - startTime,
				tokensUsed,
			});
		});

		proc.on("error", (err: Error) => {
			clearTimeout(killTimer);
			onSpawn(null as any);
			try { unlinkSync(contextFile); } catch {}
			resolve({
				output: `Error spawning agent: ${err.message}`,
				exitCode: 1,
				elapsed: Date.now() - startTime,
				tokensUsed: 0,
			});
		});
	});
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let ledger: Ledger | null = null;
	let allAgents: Map<string, AgentDef> = new Map();
	let projectSettings: ProjectSettings | null = null;
	let projectSkillNames: string[] = [];
	let workflowDir = "";
	let sessDir = "";
	let cwd = "";
	let widgetCtx: any;
	let gridCols = 4;
	let currentAgentProc: ReturnType<typeof spawn> | null = null;
	const DEFAULT_TIMEOUT_MINUTES = 15;
	let lastSupervisorModel = "";

	// ── Free-text answer channel ──────────────────────────────────────────────
	// When an agent calls ask_supervisor() and the user picks "✏️ Other",
	// we arm this callback.  pi.on("input") below intercepts the user's next
	// typed message, resolves the promise with the raw text, and returns
	// { action: "handled" } so the LLM never sees it.
	let pendingAnswerCallback: ((text: string) => void) | null = null;
	let pendingQuestion = "";   // displayed in the card while waiting

	// Per-state card tracking — one entry per workflow state
	interface StateCard {
		stateName: string;
		agentName: string;
		status: "pending" | "running" | "done" | "error";
		elapsed: number;
		tokensUsed: number;
		modelName: string;
		lastLine: string;
		startedAt: number;
		timer?: ReturnType<typeof setInterval>;
	}
	const stateCards = new Map<string, StateCard>();

	function initStateCards(workflowDef: WorkflowDef) {
		stateCards.clear();
		for (const [stateName, stateDef] of Object.entries(workflowDef.states)) {
			stateCards.set(stateName, {
				stateName,
				agentName: stateDef.agent || "(inline)",
				status: "pending",
				elapsed: 0,
				tokensUsed: 0,
				modelName: "",
				lastLine: "",
				startedAt: 0,
			});
		}
	}

	function restoreStateCards(workflowDef: WorkflowDef, history: StateRecord[], currentState: string) {
		initStateCards(workflowDef);
		// Replay history in order — later entries for the same state overwrite earlier
		// ones, so retried states end up showing their most recent run's data.
		for (const h of history) {
			const card = stateCards.get(h.state);
			if (card) {
				card.status   = (h.exitCode === 0 || h.exitCode === undefined) ? "done" : "error";
				card.agentName  = h.agentName;
				card.modelName  = h.modelUsed || "";
				card.elapsed    = h.elapsed;
				card.tokensUsed = h.tokensUsed;
				card.lastLine   = h.outputPreview || "";
			}
		}
		// currentState overrides whatever history said — it's the state that was
		// running (or paused) when the session was interrupted.
		const current = stateCards.get(currentState);
		if (current) current.status = "pending";
	}

	// ── Card Rendering (pi-pi style) ────────────────────────────────────────

	function renderCard(card: StateCard, colWidth: number, theme: any): string[] {
		const w = colWidth - 2;
		const trunc = (s: string, max: number) => s.length > max ? s.slice(0, max - 3) + "..." : s;

		const statusIcon = card.status === "pending" ? "○"
			: card.status === "running" ? "●"
			: card.status === "done" ? "✓" : "✗";
		const statusColor = card.status === "pending" ? "dim"
			: card.status === "running" ? "accent"
			: card.status === "done" ? "success" : "error";

		const stateName = displayName(card.stateName);
		const nameStr = theme.fg("accent", theme.bold(trunc(stateName, w)));
		const nameVisible = Math.min(stateName.length, w);

		const modelText = card.modelName ? trunc(card.modelName, w - 1) : "";
		const modelLine = modelText ? theme.fg("dim", modelText) : theme.fg("dim", "—");
		const modelVisible = modelText ? modelText.length : 1;

		const elapsedStr = card.elapsed > 0 ? ` ${fmtElapsed(card.elapsed)}` : "";
		const tokStr = card.tokensUsed > 0 ? ` ${card.tokensUsed.toLocaleString()}t` : "";
		const statusStr = `${statusIcon} ${card.status}${elapsedStr}${tokStr}`;
		const statusLine = theme.fg(statusColor, statusStr);
		const statusVisible = statusStr.length;

		const agentText = card.agentName && card.agentName !== "(inline)"
			? trunc(card.agentName, w - 1) : "";
		const agentLine = agentText ? theme.fg("muted", agentText) : theme.fg("dim", "—");
		const agentVisible = agentText ? agentText.length : 1;

		const lastText = trunc(card.lastLine || "", w - 1);
		const lastLine = lastText ? theme.fg("dim", lastText) : theme.fg("dim", "—");
		const lastVisible = lastText ? lastText.length : 1;

		const colors = AGENT_COLORS[card.agentName?.toLowerCase() || ""];
		const bg = colors?.bg ?? "";
		const br = colors?.br ?? "";
		const bgr = bg ? BG_RESET : "";
		const fgr = br ? FG_RESET : "";
		const bord = (s: string) => bg + br + s + bgr + fgr;

		const top = "┌" + "─".repeat(w) + "┐";
		const bot = "└" + "─".repeat(w) + "┘";
		const border = (content: string, visLen: number) => {
			const pad = " ".repeat(Math.max(0, w - visLen));
			return bord("│") + bg + content + bg + pad + bgr + bord("│");
		};

		return [
			bord(top),
			border(" " + nameStr, 1 + nameVisible),
			border(" " + modelLine, 1 + modelVisible),
			border(" " + statusLine, 1 + statusVisible),
			border(" " + agentLine, 1 + agentVisible),
			border(" " + lastLine, 1 + lastVisible),
			bord(bot),
		];
	}

	// ── Widget ──────────────────────────────────────────────────────────────

	function updateWidget() {
		if (!widgetCtx) return;

		widgetCtx.ui.setWidget("chronicle", (_tui: any, theme: any) => {
			return {
				render(width: number): string[] {
					if (!ledger || stateCards.size === 0) {
						return ["", theme.fg("dim", "  No workflow active. /chronicle-start to begin")];
					}

					const cards = Array.from(stateCards.values());
					const cols = Math.min(gridCols, cards.length);
					const gap = 1;
					const colWidth = Math.floor((width - gap * (cols - 1)) / cols) - 1;

					// Stats header
					const runningCard = cards.find(c => c.status === "running");
					const totalElapsed = (ledger?.totalElapsed ?? 0) + (runningCard?.elapsed ?? 0);
					const uniqueDone = new Set(ledger!.history.map(h => h.state)).size;
					const totalRuns  = ledger!.history.length;
					const retryNote  = totalRuns > uniqueDone ? ` +${totalRuns - uniqueDone}↺` : "";
					const statsLine = [
						theme.fg("dim", `📜 ${ledger!.workflowName}`),
						theme.fg("dim", ` · ${uniqueDone}/${cards.length} states${retryNote}`),
						theme.fg("dim", ` · ${ledger!.totalTokens.toLocaleString()} tokens`),
						theme.fg("dim", ` · ${fmtElapsed(totalElapsed)}`),
					].join("");

					const lines: string[] = ["", statsLine, ""];

					for (let i = 0; i < cards.length; i += cols) {
						const rowCards = cards.slice(i, i + cols);
						const rendered = rowCards.map(c => renderCard(c, colWidth, theme));
						while (rendered.length < cols) {
							rendered.push(Array(7).fill(" ".repeat(colWidth)));
						}
						const cardHeight = rendered[0].length;
						for (let line = 0; line < cardHeight; line++) {
							lines.push(rendered.map(rc => rc[line] || "").join(" ".repeat(gap)));
						}
					}

					return lines;
				},
				invalidate() {},
			};
		});
	}

	function startCardTimer(stateName: string) {
		const card = stateCards.get(stateName);
		if (!card) return;
		card.startedAt = Date.now();
		if (card.timer) clearInterval(card.timer);
		card.timer = setInterval(() => {
			card.elapsed = Date.now() - card.startedAt;
			updateWidget();
		}, 1000);
	}

	function stopCardTimer(stateName: string) {
		const card = stateCards.get(stateName);
		if (!card) return;
		if (card.timer) { clearInterval(card.timer); card.timer = undefined; }
	}

	function stopAllCardTimers() {
		for (const card of stateCards.values()) {
			if (card.timer) { clearInterval(card.timer); card.timer = undefined; }
		}
	}

	function resolveSupervisorModel(ctx: any): string | null {
		const m = ctx?.model?.provider && ctx?.model?.id
			? `${ctx.model.provider}/${ctx.model.id}`
			: "";
		if (m) {
			lastSupervisorModel = m;
			return m;
		}
		return lastSupervisorModel || null;
	}

	// ── captureTypedAnswer ───────────────────────────────────────────────────
	// Arms the pi.on("input") interceptor and waits for the user to type their
	// answer in the normal Pi chat input.  The input event returns
	// { action: "handled" } so the LLM never sees it.
	// The card's lastLine shows the question while we wait.

	function captureTypedAnswer(question: string, stateName: string): Promise<string> {
		pendingQuestion = question;

		// Show the question in the running card so the user knows what to answer
		const card = stateCards.get(stateName);
		if (card) {
			card.lastLine = `⌨  ${question}`;
			updateWidget();
		}

		// Notify the user clearly — this appears as a banner in the Pi TUI
		if (widgetCtx) {
			widgetCtx.ui.notify(
				`💬 Agent question: "${question}"\n\nType your answer in the chat input and press Enter.\n(Your response goes to the agent — not to the AI supervisor)`,
				"info",
			);
		}

		return new Promise<string>((resolve) => {
			pendingAnswerCallback = resolve;
		});
	}

	// ── Tool: workflow_transition ───────────────────────────────────────────

	pi.registerTool({
		name: "workflow_transition",
		label: "Workflow Transition",
		description:
			"Transition the workflow to a new state. Resolves the target state's agent " +
			"(from .pi/agents/*.md) and any associated skills, then spawns that agent with " +
			"the full workflow snapshot as context. Waits for completion and returns output. " +
			"Use workflow_status to see valid next states before calling this.",
		parameters: Type.Object({
			to_state: Type.String({
				description: "Target state name (must exist in the workflow definition)",
			}),
			task: Type.String({
				description: "Specific, detailed task for this state's agent — include all relevant context",
			}),
			summary: Type.String({
				description: "Summary of what was accomplished in the CURRENT state (saved to the ledger)",
			}),
		}),

		async execute(_callId, params, _signal, onUpdate, ctx) {
			const { to_state, task, summary } = params as {
				to_state: string; task: string; summary: string;
			};

			if (!ledger) {
				return { content: [{ type: "text", text: "No active workflow. Use /chronicle-start to begin." }] };
			}

			const targetStateDef = ledger.workflowDef.states[to_state];
			if (!targetStateDef) {
				const available = Object.keys(ledger.workflowDef.states).join(", ");
				return {
					content: [{ type: "text", text: `Unknown state "${to_state}". Available: ${available}` }],
				};
			}

			// Anti-loop check
			const transKey = `${ledger.currentState}->${to_state}`;
			ledger.transitionCounts[transKey] = (ledger.transitionCounts[transKey] || 0) + 1;
			if (ledger.transitionCounts[transKey] > 3) {
				ledger.status = "human_intervention";
				saveLedger(sessDir, ledger);
				updateWidget();
				return {
					content: [{
						type: "text",
						text:
							`⚠️  Anti-loop triggered: "${transKey}" has cycled ${ledger.transitionCounts[transKey]} times.\n` +
							`Workflow paused. Use /chronicle-status to inspect the ledger.\n` +
							`Try a different next state or end the workflow.`,
					}],
				};
			}

			// ── Pre-run approval gate ─────────────────────────────────────────
			// Only fires when requires_approval:true AND approval_mode is "pre"
			// (or unset — "pre" is the default).
			// approval_mode:"post" states (e.g. plan-approval) skip this: the agent
			// runs first and the gate fires only if the verdict is APPROVE.
			const approvalMode = targetStateDef.approval_mode ?? "pre";
			if (targetStateDef.requires_approval && approvalMode === "pre" && widgetCtx) {
				const agentLabel = targetStateDef.agent ? ` (agent: ${targetStateDef.agent})` : "";
				const choice = await widgetCtx.ui.select(
					`Approve transition to "${displayName(to_state)}"${agentLabel}?`,
					["Yes — proceed", "No — stay in current state"],
				);
				if (!choice || choice.startsWith("No")) {
					return { content: [{ type: "text", text: `Transition to "${to_state}" cancelled.` }] };
				}
			}

			// Resolve the agent for this state
			const resolved = resolveStateAgent(
				targetStateDef, to_state, ledger, task, allAgents, cwd,
				projectSettings, projectSkillNames,
			);
			const model = resolveSupervisorModel(ctx);
			if (!model) {
				return {
					content: [{
						type: "text",
						text: "Cannot resolve supervisor model for sub-agent spawn. Set/select a model for the main session first.",
					}],
				};
			}
			const runModel = resolved.modelOverride || model;

			// Stop the previous card's timer.
			// Do NOT force its status to "done" — it already reflects what actually
			// happened (done / error / timeout).  The supervisor calling
			// workflow_transition is the signal to move on, not to retroactively
			// mark the previous state as successful.
			const prevCard = stateCards.get(ledger.currentState);
			if (prevCard) stopCardTimer(ledger.currentState);

			// Transition — save the task so it's persisted for resume
			ledger.currentState = to_state;
			ledger.currentStateTask = task;
			ledger.status = "running";
			saveLedger(sessDir, ledger);

			const targetCard = stateCards.get(to_state);
			if (targetCard) {
				targetCard.status = "running";
				targetCard.agentName = resolved.agentName;
				targetCard.modelName = runModel;
				targetCard.lastLine = "";
				startCardTimer(to_state);
			}
			updateWidget();

			// Notify which agent + skills are being used
			const skillsLabel = resolved.skillPaths.length
				? ` + ${resolved.skillPaths.length} skill(s)`
				: "";
			const agentLabel = resolved.agentName !== "(inline)"
				? `agent: ${resolved.agentName}${skillsLabel}`
				: `inline persona${skillsLabel}`;

			if (onUpdate) {
				onUpdate({
					content: [{ type: "text", text: `→ ${displayName(to_state)} [${agentLabel}]` }],
					details: { to_state, task, status: "running", agent: resolved.agentName },
				});
			}

			const timeoutMs = (targetStateDef.timeout_minutes ?? DEFAULT_TIMEOUT_MINUTES) * 60 * 1000;

			const questionHandler = async (q: AgentQuestion) => {
				if (!widgetCtx) return "[NO_UI] Running without a TUI context.";

				const choices = [
					...(q.options.length > 0 ? q.options : []),
					...(q.allowFreeText || q.options.length === 0
						? ["✏️  Other — type my own answer"] : []),
				];

				const header = `🤔 Agent question (${displayName(to_state)}): ${q.question}`;

				// Pure free-text (no options) — go straight to input capture
				if (choices.length <= 1) {
					return captureTypedAnswer(q.question, to_state);
				}

				const choice = await widgetCtx.ui.select(header, choices);

				if (!choice || choice.startsWith("✏️")) {
					return captureTypedAnswer(q.question, to_state);
				}
				return choice;
			};

			let result = await spawnStateAgent(
				resolved, model, sessDir, to_state, ledger.id,
				timeoutMs,
				(progress) => {
					const card = stateCards.get(to_state);
					if (card) { card.lastLine = progress; updateWidget(); }
				},
				(proc) => { currentAgentProc = proc; },
				questionHandler,
			);

			// Loop-breaker: some implementation runs keep repeating
			// "Reply exactly: Proceed with tool execution now" instead of executing.
			// Retry once with an explicit anti-loop execution override.
			if (to_state === "implementation" && result.exitCode === 0 && isExecutionApprovalLoop(result.output)) {
				if (onUpdate) {
					onUpdate({
						content: [{
							type: "text",
							text: "⚠️  Detected execution-approval loop in implementation output. Retrying once with forced tool-first override.",
						}],
						details: { to_state, status: "retrying_loop_breaker" },
					});
				}

				const retryResolved: ResolvedStateAgent = {
					...resolved,
					workflowContext:
						resolved.workflowContext + "\n\n" +
						"## Execution Override (Chronicle)\n" +
						"You are already authorized to run tools now. Do NOT ask for further approval.\n" +
						"Immediately execute at least one concrete repository command before any narrative text.\n" +
						"Then continue implementing all requested changes and provide evidence.",
				};

				const retry = await spawnStateAgent(
					retryResolved, model, sessDir, to_state, ledger.id,
					timeoutMs,
					(progress) => {
						const card = stateCards.get(to_state);
						if (card) { card.lastLine = progress; updateWidget(); }
					},
					(proc) => { currentAgentProc = proc; },
					questionHandler,
				);

				// Aggregate run metrics across both attempts
				result = {
					output: retry.output,
					exitCode: retry.exitCode,
					elapsed: result.elapsed + retry.elapsed,
					tokensUsed: result.tokensUsed + retry.tokensUsed,
				};
			}

			stopCardTimer(to_state);
			const doneCard = stateCards.get(to_state);
			if (doneCard) {
				doneCard.status = result.exitCode === 0 ? "done"
					: result.exitCode === 124 ? "error"
					: "error";
				doneCard.tokensUsed = result.tokensUsed;
				doneCard.elapsed = result.elapsed;
				doneCard.lastLine = result.exitCode === 124
					? `⏱ timed out after ${Math.round(result.elapsed / 60000)}m`
					: (result.output.split("\n").filter(l => l.trim()).pop() || "");
			}

			// Always accumulate totals
			ledger.totalTokens  += result.tokensUsed;
			ledger.totalElapsed += result.elapsed;

			// ── Timeout: pause workflow and surface to user ───────────────────
			if (result.exitCode === 124) {
				ledger.status = "paused";

				// Preserve whatever the agent produced — the next attempt or the
				// skip path both benefit from having partial findings in context.
				const partialPreview = result.output.slice(0, 1200).trim();
				if (partialPreview) {
					ledger.snapshot.keyFindings.push(
						`[Partial – ${displayName(to_state)} timed out] ${partialPreview}`,
					);
				}

				saveLedger(sessDir, ledger);
				updateWidget();

				const timeoutMins = Math.round(result.elapsed / 60000);
				const partialSection = partialPreview
					? `\n\n**Partial output captured** (saved to snapshot):\n${partialPreview.slice(0, 500)}...`
					: "\n\n*(No output was captured before the timeout.)*";

				return {
					content: [{
						type: "text",
						text:
							`⏱ **${displayName(to_state)}** [${resolved.agentName}] timed out after ${timeoutMins} minutes.\n\n` +
							`The workflow is now **PAUSED** at this state. ` +
							`The agent did not finish — advancing without its output would compromise workflow integrity.\n` +
							partialSection +
							`\n\n---\n` +
							`**Please ask the user what they want to do:**\n\n` +
							`- **Retry** — run this state again (the agent will start fresh, partial findings are in the snapshot)\n` +
							`- **Skip** — advance past this state; call \`workflow_update_snapshot\` first to note it was skipped, then \`workflow_transition\` to the next state\n` +
							`- **Abort** — end the workflow\n\n` +
							`Current state remains: **${displayName(to_state)}**`,
					}],
					details: {
						to_state, task, status: "timed_out",
						agent: resolved.agentName,
						elapsed: result.elapsed,
						tokensUsed: result.tokensUsed,
					},
				};
			}

			// ── Post-run approval gate (approval_mode:"post") ────────────────
			// Runs AFTER the agent so the verdict shapes what happens next.
			// APPROVE  → show human confirmation dialog before proceeding
			// BLOCK    → surface structured result; supervisor asks user for routing
			if (targetStateDef.requires_approval && approvalMode === "post") {
				const verdictInfo = detectVerdict(result.output);

				if (verdictInfo.verdict === "block") {
					// Don't push to history — treat like a pause so the state can
					// be re-run after corrections are made.
					ledger.status = "paused";
					const partial = result.output.slice(0, 2000);

					// Extract which review states the output mentions so the
					// supervisor can offer concrete routing options to the user.
					const reviewStates = (targetStateDef.next ?? []).filter(
						s => s !== "implementation" && s !== "done",
					);
					const routingHint = reviewStates.length
						? `\nAvailable correction routes: ${reviewStates.map(s => `\`${s}\``).join(", ")}`
						: "";

					saveLedger(sessDir, ledger);
					updateWidget();

					return {
						content: [{
							type: "text",
							text:
								`⛔ **${displayName(to_state)}** — plan reviewer issued a **BLOCK**.\n\n` +
								`The plan has not been approved. Do NOT proceed to implementation.\n` +
								`(Verdict parser source: ${verdictInfo.source})\n` +
								`**Ask the user** what they want to do:\n\n` +
								`- Route back to one or more specialist agents to address the corrections\n` +
								`- Override the block and proceed anyway (user must explicitly confirm this)\n` +
								`- Abort the workflow\n` +
								routingHint +
								`\n\n---\n**Reviewer output:**\n\n${partial}`,
						}],
						details: { to_state, task, status: "blocked", verdict: "block", verdict_source: verdictInfo.source },
					};
				}

				// verdictInfo.verdict === "approve" → show human confirmation before implementation
				if (widgetCtx) {
					const choice = await widgetCtx.ui.select(
						`✅ Plan reviewer approved the plan. Proceed to implementation?`,
						["Yes — begin implementation", "No — revise the plan further"],
					);
					if (!choice || choice.startsWith("No")) {
						// User wants more revision — pause here too
						ledger.status = "paused";
						saveLedger(sessDir, ledger);
						return {
							content: [{
								type: "text",
								text: `Implementation deferred. Workflow paused at ${displayName(to_state)}.\n` +
									`Call workflow_transition to route back to planning or any review state.`,
							}],
						};
					}
				}
				// Human approved — fall through to normal completion below
			}

			// ── Normal completion (success or non-timeout error) ──────────────
			// Push THIS state's record to history now that its agent has finished.
			// We record it here — after the run — so:
			//   • tokensUsed and elapsed are the real numbers from this agent
			//   • taskGiven is the task this agent actually received
			//   • backwards transitions (retries) produce separate records per run
			//   • resume/continues load correct per-state data from disk
			const completedAt = Date.now();
			const record: StateRecord = {
				state: to_state,
				agentName: resolved.agentName,
				modelUsed: runModel,
				startedAt: targetCard?.startedAt || (completedAt - result.elapsed),
				completedAt,
				summary,
				tokensUsed: result.tokensUsed,
				elapsed: result.elapsed,
				taskGiven: task,
				outputPreview: result.output.slice(0, 300),
				exitCode: result.exitCode,
			};
			ledger.history.push(record);

			if (targetStateDef.next.length === 0 || to_state === "done") {
				ledger.status = "done";
			}
			saveLedger(sessDir, ledger);
			updateWidget();

			const truncated = result.output.length > 8000
				? result.output.slice(0, 8000) + "\n\n... [truncated]"
				: result.output;

			const statusLabel = result.exitCode === 0 ? "done" : "error";
			const header =
				`[${ledger.workflowName}] ${displayName(to_state)} [${agentLabel}] ` +
				`${statusLabel} in ${fmtElapsed(result.elapsed)} · ${result.tokensUsed.toLocaleString()} tokens`;

			return {
				content: [{ type: "text", text: `${header}\n\n${truncated}` }],
				details: {
					to_state, task, status: statusLabel,
					agent: resolved.agentName,
					skills: resolved.skillPaths,
					elapsed: result.elapsed,
					tokensUsed: result.tokensUsed,
					fullOutput: result.output,
				},
			};
		},

		renderCall(args, theme) {
			const to = (args as any).to_state || "?";
			const task = (args as any).task || "";
			const preview = task.length > 50 ? task.slice(0, 47) + "..." : task;
			return new Text(
				theme.fg("toolTitle", theme.bold("workflow_transition ")) +
				theme.fg("accent", displayName(to)) +
				theme.fg("dim", " — ") +
				theme.fg("muted", preview),
				0, 0,
			);
		},

		renderResult(result, options, theme) {
			const details = result.details as any;
			if (!details) {
				const t = result.content[0];
				return new Text(t?.type === "text" ? t.text : "", 0, 0);
			}
			if (options.isPartial || details.status === "running") {
				const agent = details.agent && details.agent !== "(inline)"
					? theme.fg("dim", ` [${details.agent}]`)
					: "";
				return new Text(
					theme.fg("accent", `● ${displayName(details.to_state || "?")}`) + agent +
					theme.fg("dim", " running..."),
					0, 0,
				);
			}
			const icon = details.status === "done" ? "✓" : "✗";
			const color = details.status === "done" ? "success" : "error";
			const elapsed = typeof details.elapsed === "number" ? fmtElapsed(details.elapsed) : "?";
			const tokens = typeof details.tokensUsed === "number"
				? ` ${details.tokensUsed.toLocaleString()} tokens` : "";
			const agentLabel = details.agent && details.agent !== "(inline)"
				? theme.fg("dim", ` [${details.agent}]`) : "";
			const header =
				theme.fg(color, `${icon} ${displayName(details.to_state || "?")}`) +
				agentLabel +
				theme.fg("dim", ` ${elapsed}${tokens}`);
			if (options.expanded && details.fullOutput) {
				const out = details.fullOutput.length > 4000
					? details.fullOutput.slice(0, 4000) + "\n... [truncated]"
					: details.fullOutput;
				return new Text(header + "\n" + theme.fg("muted", out), 0, 0);
			}
			return new Text(header, 0, 0);
		},
	});

	// ── Tool: workflow_update_snapshot ──────────────────────────────────────

	pi.registerTool({
		name: "workflow_update_snapshot",
		label: "Update Workflow Snapshot",
		description:
			"Checkpoint findings into the persistent ledger. Everything saved here is " +
			"injected into all future states' context. Call this after each transition " +
			"to preserve key discoveries, file changes, and pending work.",
		parameters: Type.Object({
			key_findings: Type.Optional(Type.Array(Type.String(), {
				description: "Key discoveries, decisions, or facts from the completed state",
			})),
			modified_files: Type.Optional(Type.Array(Type.String(), {
				description: "Files that were created or modified",
			})),
			pending_tasks: Type.Optional(Type.Array(Type.String(), {
				description: "Tasks that still need to be done in future states",
			})),
			custom: Type.Optional(Type.Record(Type.String(), Type.Any(), {
				description: "Any additional structured context to preserve",
			})),
		}),

		async execute(_callId, params, _signal, _onUpdate, _ctx) {
			if (!ledger) return { content: [{ type: "text", text: "No active workflow." }] };

			const { key_findings, modified_files, pending_tasks, custom } = params as {
				key_findings?: string[]; modified_files?: string[];
				pending_tasks?: string[]; custom?: Record<string, any>;
			};

			if (key_findings?.length) ledger.snapshot.keyFindings.push(...key_findings);
			if (modified_files?.length) {
				const existing = new Set(ledger.snapshot.modifiedFiles);
				for (const f of modified_files) existing.add(f);
				ledger.snapshot.modifiedFiles = Array.from(existing);
			}
			if (pending_tasks?.length) ledger.snapshot.pendingTasks.push(...pending_tasks);
			if (custom) Object.assign(ledger.snapshot.custom, custom);

			saveLedger(sessDir, ledger);

			const saved: string[] = [];
			if (key_findings?.length) saved.push(`${key_findings.length} finding(s)`);
			if (modified_files?.length) saved.push(`${modified_files.length} file(s)`);
			if (pending_tasks?.length) saved.push(`${pending_tasks.length} task(s)`);
			if (custom) saved.push("custom data");

			return { content: [{ type: "text", text: `Snapshot saved: ${saved.join(", ")} → ledger [${ledger.id}]` }] };
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("workflow_update_snapshot")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const t = result.content[0];
			const msg = t?.type === "text" ? t.text : "";
			return new Text(theme.fg("success", "✓ ") + theme.fg("muted", msg), 0, 0);
		},
	});

	// ── Tool: workflow_status ───────────────────────────────────────────────

	pi.registerTool({
		name: "workflow_status",
		label: "Workflow Status",
		description:
			"Get a full summary of the active workflow ledger — state history, resolved agents, " +
			"snapshot, token budget, and valid next states. Use this before planning transitions.",
		parameters: Type.Object({}),

		async execute(_callId, _params, _signal, _onUpdate, _ctx) {
			if (!ledger) {
				return { content: [{ type: "text", text: "No active workflow. Use /chronicle-start to begin." }] };
			}

			const lines: string[] = [];
			lines.push(`## Chronicle Ledger — ${ledger.workflowName}`);
			lines.push(`**Session:** ${ledger.id}  **Status:** ${ledger.status}`);
			lines.push(`**Current State:** ${displayName(ledger.currentState)}`);
			lines.push(`**Tokens:** ${ledger.totalTokens.toLocaleString()}  **Elapsed:** ${fmtElapsed(ledger.totalElapsed)}`);
			lines.push(`**Initial Task:** ${ledger.initialTask}`);
			lines.push("");

			const currentDef = ledger.workflowDef.states[ledger.currentState];
			if (currentDef?.next.length) {
				const nexts = currentDef.next.map(n => {
					const def = ledger!.workflowDef.states[n];
					const agentRef = def?.agent ? ` (agent: ${def.agent})` : "";
					const skillsRef = (def?.extra_skills?.length || 0) > 0
						? ` +${def!.extra_skills!.length} skills` : "";
					return `**${n}**${agentRef}${skillsRef}`;
				}).join(", ");
				lines.push(`**Valid Next States:** ${nexts}`);
			} else {
				lines.push("**Valid Next States:** *(terminal — workflow complete)*");
			}
			lines.push("");

			if (ledger.history.length > 0) {
				lines.push("## History");
				for (const h of ledger.history) {
					const agentLabel = h.agentName ? ` [${h.agentName}]` : "";
					lines.push(`- **${displayName(h.state)}**${agentLabel} — ${fmtElapsed(h.elapsed)}, ${h.tokensUsed.toLocaleString()} tokens`);
					lines.push(`  *${h.summary.slice(0, 200)}*`);
				}
				lines.push("");
			}

			// Show available agents for reference
			if (allAgents.size > 0) {
				lines.push("## Available Agents");
				for (const [, def] of allAgents) {
					const skillsLabel = def.skills.length > 0
						? ` — skills: ${def.skills.join(", ")}` : "";
					lines.push(`- **${def.name}** — ${def.description}${skillsLabel}`);
				}
				lines.push("");
			}

			const snap = ledger.snapshot;
			if (snap.keyFindings.length > 0) {
				lines.push("## Key Findings");
				for (const f of snap.keyFindings) lines.push(`- ${f}`);
				lines.push("");
			}
			if (snap.modifiedFiles.length > 0) {
				lines.push("## Modified Files");
				for (const f of snap.modifiedFiles) lines.push(`- ${f}`);
				lines.push("");
			}
			if (snap.pendingTasks.length > 0) {
				lines.push("## Pending Tasks");
				for (const t of snap.pendingTasks) lines.push(`- ${t}`);
				lines.push("");
			}
			if (Object.keys(ledger.transitionCounts).length > 0) {
				lines.push("## Transition Counts");
				for (const [k, v] of Object.entries(ledger.transitionCounts)) {
					const warn = v >= 3 ? " ⚠️" : "";
					lines.push(`- ${k}: ${v}${warn}`);
				}
			}

			return { content: [{ type: "text", text: lines.join("\n") }] };
		},

		renderCall(_args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("workflow_status")), 0, 0);
		},
		renderResult(result, _options, theme) {
			const t = result.content[0];
			const msg = t?.type === "text" ? t.text : "";
			const preview = msg.split("\n").filter(l => l.trim()).slice(0, 3).join(" | ");
			return new Text(theme.fg("muted", preview), 0, 0);
		},
	});

	// ── Commands ────────────────────────────────────────────────────────────

	pi.registerCommand("chronicle-start", {
		description: "Start a new Chronicle workflow",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const workflows = loadWorkflows(workflowDir);
			if (workflows.length === 0) {
				ctx.ui.notify(`No workflows found in ${workflowDir}`, "warning");
				return;
			}

			const options = workflows.map(w => {
				const stateCount = Object.keys(w.states).length;
				const desc = w.description ? ` — ${w.description}` : "";
				return `${w.name}${desc} (${stateCount} states)`;
			});

			const choice = await ctx.ui.select("Select Workflow", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			const workflow = workflows[idx];

			ledger = {
				id: generateId(),
				workflowName: workflow.name,
				workflowPath: join(workflowDir, `${workflow.name.toLowerCase().replace(/\s+/g, "-")}.json`),
				workflowDef: workflow,
				created: Date.now(),
				lastUpdated: Date.now(),
				currentState: workflow.initial,
				currentStateTask: "",
				initialTask: "",
				history: [],
				snapshot: { modifiedFiles: [], keyFindings: [], pendingTasks: [], custom: {} },
				transitionCounts: {},
				totalTokens: 0,
				totalElapsed: 0,
				status: "running",
			};

			initStateCards(workflow);
			saveLedger(sessDir, ledger);
			updateWidget();

			// Build info about initial state
			const initStateDef = workflow.states[workflow.initial];
			const agentInfo = initStateDef?.agent
				? `First agent: **${initStateDef.agent}**`
				: "First state: inline persona";

			ctx.ui.setStatus("chronicle", `${workflow.name} · ${displayName(workflow.initial)}`);
			ctx.ui.notify(
				`📜 Chronicle started!\n` +
				`Workflow: ${workflow.name}\n` +
				`Session: ${ledger.id}\n` +
				`${agentInfo}\n\n` +
				`Describe your task and the Supervisor will drive the workflow.`,
				"success",
			);
		},
	});

	pi.registerCommand("chronicle-resume", {
		description: "Resume an interrupted Chronicle session",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const all = listLedgers(sessDir);
			if (all.length === 0) {
				ctx.ui.notify("No previous Chronicle sessions found.", "info");
				return;
			}

			const options = all.map(l => {
				const ago = Math.round((Date.now() - l.lastUpdated) / 60000);
				const agoStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
				return `${l.id.slice(0, 8)} · ${l.workflowName} · ${displayName(l.currentState)} [${l.status}] · ${agoStr}`;
			});

			const choice = await ctx.ui.select("Resume Session", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			ledger = all[idx];
			restoreStateCards(ledger.workflowDef, ledger.history, ledger.currentState);
			updateWidget();

			ctx.ui.setStatus("chronicle", `${ledger.workflowName} · ${displayName(ledger.currentState)}`);
			ctx.ui.notify(
				`📜 Chronicle resumed!\n` +
				`Session: ${ledger.id}\n` +
				`Workflow: ${ledger.workflowName}\n` +
				`Current state: ${displayName(ledger.currentState)}\n` +
				`History: ${ledger.history.length} state(s) completed\n\n` +
				`Use workflow_status to see full context, then continue.`,
				"success",
			);
		},
	});

	pi.registerCommand("chronicle-list", {
		description: "List all Chronicle sessions",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const all = listLedgers(sessDir);
			if (all.length === 0) { ctx.ui.notify("No Chronicle sessions found.", "info"); return; }

			const lines = all.map(l => {
				const ago = Math.round((Date.now() - l.lastUpdated) / 60000);
				const agoStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
				return (
					`${l.id.slice(0, 8)} · ${l.workflowName} · ` +
					`${displayName(l.currentState)} [${l.status}] · ` +
					`${l.history.length} states · ${l.totalTokens.toLocaleString()} tokens · ${agoStr}`
				);
			});

			ctx.ui.notify(`Chronicle Sessions (${all.length}):\n\n${lines.join("\n")}`, "info");
		},
	});

	pi.registerCommand("chronicle-kill", {
		description: "Kill the currently running sub-agent (use if an agent is stuck)",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			if (!currentAgentProc) {
				ctx.ui.notify("No sub-agent is currently running.", "info");
				return;
			}
			try {
				currentAgentProc.kill("SIGTERM");
				setTimeout(() => {
					try { currentAgentProc?.kill("SIGKILL"); } catch {}
				}, 3000);
				ctx.ui.notify("⏹ Kill signal sent to sub-agent. It will exit within a few seconds.", "warning");
			} catch (e: any) {
				ctx.ui.notify(`Kill failed: ${e.message}`, "error");
			}
		},
	});

	pi.registerCommand("chronicle-grid", {
		description: "Set card grid columns: /chronicle-grid <1-6>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const n = parseInt(args?.trim() || "", 10);
			if (n >= 1 && n <= 6) {
				gridCols = n;
				ctx.ui.notify(`Grid set to ${gridCols} columns`, "info");
				updateWidget();
			} else {
				ctx.ui.notify("Usage: /chronicle-grid <1-6>", "error");
			}
		},
	});

	pi.registerCommand("chronicle-settings", {
		description: "Show active project settings and resolved skills",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;

			const settingsPath = join(cwd, ".pi", "project.json");
			if (!projectSettings) {
				ctx.ui.notify(
					`No project settings found.\nCreate ${settingsPath} to configure your project.\n\n` +
					`See .pi/project.json for the template.`,
					"warning",
				);
				return;
			}

			const lines: string[] = ["Project Settings (.pi/project.json)\n"];
			lines.push(buildProjectSettingsBlock(projectSettings));
			lines.push("");

			const alwaysSkills = projectSettings.skills?.always || [];
			const autoSkills = resolveAutoSkills(projectSettings, cwd);
			const allResolved = [...new Set([...alwaysSkills, ...autoSkills])];

			if (allResolved.length > 0) {
				lines.push(`Active Project Skills (injected into every agent):`);
				for (const s of allResolved) {
					const found = projectSkillNames.includes(s)
						? "✓ resolved"
						: "⚠ not found";
					lines.push(`  ${s} — ${found}`);
				}
			} else {
				lines.push("No project skills configured.");
			}

			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("chronicle-status", {
		description: "Show the active Chronicle session details",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			if (!ledger) {
				ctx.ui.notify("No active session. Use /chronicle-start or /chronicle-resume.", "warning");
				return;
			}

			const lines: string[] = [
				`Session: ${ledger.id}`,
				`Workflow: ${ledger.workflowName}`,
				`Status: ${ledger.status}`,
				`Current State: ${displayName(ledger.currentState)}`,
				`Tokens: ${ledger.totalTokens.toLocaleString()} · Elapsed: ${fmtElapsed(ledger.totalElapsed)}`,
				`States completed: ${ledger.history.length}`,
				"",
			];

			const currentDef = ledger.workflowDef.states[ledger.currentState];
			if (currentDef?.agent) {
				const agentDef = allAgents.get(currentDef.agent.toLowerCase());
				lines.push(`Current Agent: ${currentDef.agent}${agentDef ? ` — ${agentDef.description}` : " (not found)"}`);
				if (agentDef?.skills.length) {
					lines.push(`Agent Skills: ${agentDef.skills.join(", ")}`);
				}
			}
			if (currentDef?.next.length) {
				lines.push(`Next States: ${currentDef.next.join(", ")}`);
			}

			if (ledger.snapshot.keyFindings.length)
				lines.push(`Findings: ${ledger.snapshot.keyFindings.length}`);
			if (ledger.snapshot.modifiedFiles.length)
				lines.push(`Modified files: ${ledger.snapshot.modifiedFiles.length}`);
			if (ledger.snapshot.pendingTasks.length)
				lines.push(`Pending tasks: ${ledger.snapshot.pendingTasks.length}`);

			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	// ── input event — free-text answer capture ──────────────────────────────
	// Armed by the onQuestion callback (below) when the user picks "Other".
	// Fires before the LLM sees the message — returns { action: "handled" }
	// so the typed text goes to the waiting agent, not to the supervisor.

	pi.on("input", async (event: any, _ctx: any) => {
		if (!pendingAnswerCallback) return { action: "continue" };
		if (event.source !== "interactive") return { action: "continue" };

		const cb = pendingAnswerCallback;
		pendingAnswerCallback = null;
		pendingQuestion = "";

		// Write the answer to the pending answer file so the polling tool
		// in the sub-agent picks it up immediately.
		// (spawnStateAgent writes the file; we resolve the promise here
		//  which causes the onQuestion callback to return the text, which
		//  spawnStateAgent's async IIFE then writes to the file.)
		cb(event.text);

		// Update the running card to remove the "⌨" waiting indicator
		if (ledger) {
			const card = stateCards.get(ledger.currentState);
			if (card) { card.lastLine = `✓ Answer received`; updateWidget(); }
		}

		return { action: "handled" };
	});

	// ── before_agent_start — supervisor system prompt ───────────────────────

	pi.on("before_agent_start", async (_event, _ctx) => {
		if (_ctx?.model?.provider && _ctx?.model?.id) {
			lastSupervisorModel = `${_ctx.model.provider}/${_ctx.model.id}`;
		}
		if (!ledger) return {};

		const currentDef = ledger.workflowDef.states[ledger.currentState];
		const nextStates = currentDef?.next || [];

		const nextStateList = nextStates.length
			? nextStates.map(n => {
				const def = ledger!.workflowDef.states[n];
				const agentDef = def?.agent ? allAgents.get(def.agent.toLowerCase()) : null;
				const agentLabel = def?.agent
					? ` → agent: **${def.agent}**${agentDef ? ` (${agentDef.description})` : " ⚠️ not found"}`
					: "";
				const skillsLabel = (agentDef?.skills.length || def?.extra_skills?.length)
					? ` · skills: ${[...(agentDef?.skills || []), ...(def?.extra_skills || [])].join(", ")}`
					: "";
				return `- **${n}**${agentLabel}${skillsLabel}: ${def?.description || ""}`;
			}).join("\n")
			: "*(terminal — workflow is complete)*";

		// Full workflow map
		const allStates = Object.entries(ledger.workflowDef.states)
			.map(([name, def]) => {
				const agentDef = def.agent ? allAgents.get(def.agent.toLowerCase()) : null;
				const agentLabel = def.agent
					? ` [${def.agent}${agentDef ? "" : " ⚠️"}]`
					: "";
				const nexts = def.next.length ? ` → ${def.next.join(", ")}` : " → (end)";
				return `- **${name}**${agentLabel}${nexts}: ${def.description}`;
			}).join("\n");

		const histSummary = ledger.history.length > 0
			? ledger.history.map(h =>
				`- **${displayName(h.state)}** [${h.agentName}] (${fmtElapsed(h.elapsed)}): ${h.summary.slice(0, 150)}`,
			).join("\n")
			: "*(no states completed yet)*";

		const agentCatalog = allAgents.size > 0
			? Array.from(allAgents.values()).map(a => {
				const skillsLabel = a.skills.length ? `  Skills: ${a.skills.join(", ")}` : "";
				const modelLabel = a.model ? `  Model: ${a.model}` : "";
				return `- **${a.name}**: ${a.description}\n  Tools: ${a.tools}${skillsLabel}${modelLabel}`;
			}).join("\n")
			: "*(no agents found in .pi/agents/)*";

		const snap = ledger.snapshot;
		const artifacts = resolveChronicleArtifacts(projectSettings);

		return {
			systemPrompt: `You are the **Chronicle Supervisor** driving the workflow "${ledger.workflowName}".
You coordinate specialist agents by calling \`workflow_transition\` to run each state.
You have NO direct codebase access — all real work is done by the agents you spawn.

## Active Workflow: ${ledger.workflowName}
${ledger.workflowDef.description ? `*${ledger.workflowDef.description}*\n` : ""}
**Session:** ${ledger.id}  **Status:** ${ledger.status}
**Current State:** ${displayName(ledger.currentState)}
**Tokens used:** ${ledger.totalTokens.toLocaleString()}  **Elapsed:** ${fmtElapsed(ledger.totalElapsed)}
**Initial Task:** ${ledger.initialTask || "(set when first transition runs)"}

## Workflow Map (state [agent] → next: description)
${allStates}

## Valid Next States from "${ledger.currentState}"
${nextStateList}

## History
${histSummary}
${snap.keyFindings.length ? `\n## Key Findings\n${snap.keyFindings.map(f => `- ${f}`).join("\n")}` : ""}${snap.modifiedFiles.length ? `\n\n## Modified Files\n${snap.modifiedFiles.map(f => `- ${f}`).join("\n")}` : ""}${snap.pendingTasks.length ? `\n\n## Pending Tasks\n${snap.pendingTasks.map(t => `- ${t}`).join("\n")}` : ""}

## Available Agents (loaded from .pi/agents/)
${agentCatalog}

## Artifact Path Policy (STRICT)
Canonical Chronicle artifact paths:
- Backlog: \`${artifacts.backlogPath}\`
- Sprint plan: \`${artifacts.sprintPlanPath}\`
- Reports directory: \`${artifacts.reportsDir}\`
- Temp directory: \`${artifacts.tempDir}\`

Rules:
- Never create duplicate backlog/sprint files in other locations (e.g. root-level \`backlog.json\` or \`sprint-plan.md\`).
- Non-application reports, diagnostics, helper scripts, and temp outputs MUST be kept under reports/temp directories above.
- If an agent proposes writing outside these paths for non-application artifacts, redirect it to the canonical directory.

## Your Tools
- \`workflow_transition(to_state, task, summary)\`
  Runs the next state. The agent is resolved automatically from the workflow definition.
  Include ALL relevant context in \`task\` — agents have no memory beyond what you pass.
- \`workflow_update_snapshot(key_findings, modified_files, pending_tasks, custom)\`
  Save important findings to the persistent ledger BEFORE transitioning.
- \`workflow_status()\`
  Full ledger dump — history, agents, snapshot, transition counts.

## Workflow Guidelines
1. Begin by calling \`workflow_transition\` for the initial state with a clear, detailed task
2. After each state, review the output and save findings with \`workflow_update_snapshot\`
3. Choose the next state based on the output (states can branch — see "Valid Next States")
4. Pass all relevant context explicitly in the \`task\` parameter each time
5. The workflow ends when you reach a terminal state (no valid next states)
6. If the same two states cycle more than 3 times, the workflow auto-pauses for human review`,
		};
	});

	// ── session_start ─────────────────────────────────────────────────────────

	pi.on("session_start", async (_event, _ctx) => {
		applyExtensionDefaults(import.meta.url, _ctx);
		if (_ctx?.model?.provider && _ctx?.model?.id) {
			lastSupervisorModel = `${_ctx.model.provider}/${_ctx.model.id}`;
		}

		if (widgetCtx) widgetCtx.ui.setWidget("chronicle", undefined);
		widgetCtx = _ctx;
		cwd = _ctx.cwd;

		stopAllCardTimers();
		ledger = null;
		stateCards.clear();

		workflowDir = join(cwd, ".pi", "chronicle", "workflows");
		sessDir = join(cwd, ".pi", "chronicle", "sessions");
		mkdirSync(workflowDir, { recursive: true });
		mkdirSync(sessDir, { recursive: true });

		// Load all available agents
		allAgents = scanAgentDirs(cwd);

		// Load project settings and resolve project-level skills
		projectSettings = loadProjectSettings(cwd);
		if (projectSettings) {
			const alwaysNames = projectSettings.skills?.always || [];
			const autoNames = resolveAutoSkills(projectSettings, cwd);
			const allNames = [...new Set([...alwaysNames, ...autoNames])];
			projectSkillNames = resolveSkillPaths(allNames, cwd);
		} else {
			projectSkillNames = [];
		}

		const artifactPaths = resolveChronicleArtifacts(projectSettings);
		mkdirSync(join(cwd, artifactPaths.reportsDir), { recursive: true });
		mkdirSync(join(cwd, artifactPaths.tempDir), { recursive: true });

		const dupes: string[] = [];
		if (artifactPaths.backlogPath !== "backlog.json" && existsSync(join(cwd, "backlog.json"))) dupes.push("backlog.json");
		if (artifactPaths.sprintPlanPath !== "sprint-plan.md" && existsSync(join(cwd, "sprint-plan.md"))) dupes.push("sprint-plan.md");
		if (dupes.length) {
			_ctx.ui.notify(
				`⚠ Chronicle duplicate planning artifacts detected: ${dupes.join(", ")}\n` +
				`Canonical paths are configured in .pi/project.json:\n` +
				`- backlog: ${artifactPaths.backlogPath}\n` +
				`- sprint plan: ${artifactPaths.sprintPlanPath}`,
				"warning",
			);
		}

		pi.setActiveTools(["workflow_transition", "workflow_update_snapshot", "workflow_status"]);

		updateWidget();

		_ctx.ui.setStatus("chronicle", "Chronicle — no workflow");

		const agentCount = allAgents.size;
		const settingsLabel = projectSettings
			? `Project: ${projectSettings.project?.name || "(unnamed)"} · ${projectSkillNames.length} project skill(s) active`
			: "No .pi/project.json — using defaults";
		_ctx.ui.notify(
			`📜 The Chronicle\n\n` +
			`State machine workflow orchestrator.\n` +
			`${agentCount} agent(s) loaded · ${settingsLabel}\n\n` +
			`/chronicle-start      Start a new workflow\n` +
			`/chronicle-resume     Resume an interrupted session\n` +
			`/chronicle-list       List all sessions\n` +
			`/chronicle-status     Show active session details\n` +
			`/chronicle-settings   Show project settings & active skills`,
			"info",
		);

		// Footer: model | workflow · state | context bar
		_ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const model = _ctx.model?.id || "no-model";
				const usage = _ctx.getContextUsage();
				const pct = usage ? usage.percent : 0;
				const filled = Math.round(pct / 10);
				const bar = "#".repeat(filled) + "-".repeat(10 - filled);

				const workflowLabel = ledger
					? theme.fg("accent", ledger.workflowName) +
					theme.fg("dim", " · ") +
					theme.fg("muted", displayName(ledger.currentState))
					: theme.fg("dim", "no workflow");

				const left =
					theme.fg("dim", ` ${model}`) +
					theme.fg("muted", " · ") +
					workflowLabel;
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}
