/**
 * chronicle-ask.ts
 *
 * Tiny extension loaded ONLY by Chronicle sub-agents (not the main session).
 * Provides a single tool: ask_supervisor()
 *
 * How it works
 * ────────────
 * 1. Agent calls ask_supervisor("Which DB pattern?", ["Repository", "ActiveRecord"])
 * 2. Tool writes a __CQ__:<base64-json> marker line to stdout
 *    (Chronicle's spawnStateAgent line reader picks this up)
 * 3. Tool polls sessDir/answer-<ledgerId>-<state>.json every 400 ms (10 min max)
 * 4. Chronicle shows ui.select to user with the provided options + "✏️ Other"
 *    • If the user picks a listed option → answer written to file immediately
 *    • If the user picks "Other" → Chronicle arms a pi.on("input") interceptor;
 *      the user types their answer in the normal Pi chat input and presses Enter;
 *      Chronicle captures it (the LLM never sees it) and writes it to the file
 * 5. Tool returns the answer string to the agent LLM → agent continues
 *
 * Environment variables set by Chronicle's spawnStateAgent:
 *   CHRONICLE_SESS_DIR   – absolute path to the session directory
 *   CHRONICLE_LEDGER_ID  – ledger UUID
 *   CHRONICLE_STATE      – current workflow state key
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";

const SESS_DIR   = process.env.CHRONICLE_SESS_DIR   || "";
const LEDGER_ID  = process.env.CHRONICLE_LEDGER_ID  || "";
const STATE_NAME = process.env.CHRONICLE_STATE      || "";

const POLL_MS     = 400;
const MAX_WAIT_MS = 10 * 60 * 1000; // 10 minutes

function answerFilePath(): string {
	return join(SESS_DIR, `answer-${LEDGER_ID}-${STATE_NAME}.json`);
}

function sleep(ms: number): Promise<void> {
	return new Promise((res) => setTimeout(res, ms));
}

export default function register(pi: any) {
	if (!SESS_DIR || !LEDGER_ID || !STATE_NAME) {
		// Loaded outside a Chronicle sub-agent — do nothing
		return;
	}

	pi.registerTool({
		name: "ask_supervisor",
		description:
			"Ask the user a question and wait for their answer before continuing. " +
			"Use this when you need user input to proceed — e.g. choosing a design pattern, " +
			"confirming scope, or resolving an ambiguity. " +
			"The user will see your question and options in the UI and can either pick one " +
			"or type a free-text answer directly. You will receive their response and can continue.",
		inputSchema: Type.Object({
			question: Type.String({
				description: "The question to present to the user (be specific and concise)",
			}),
			options: Type.Optional(
				Type.Array(Type.String(), {
					description:
						"Suggested answer options to present as a list. Include these whenever " +
						"a finite set of choices makes sense. The user can also pick 'Other'.",
				}),
			),
			allow_free_text: Type.Optional(
				Type.Boolean({
					description:
						"Set true to offer the user a free-text 'Other' option in addition to " +
						"any provided options. Defaults to true when options are provided.",
				}),
			),
		}),

		async execute(_callId: string, params: any) {
			const { question, options, allow_free_text } = params as {
				question: string;
				options?: string[];
				allow_free_text?: boolean;
			};

			// Clean up any stale answer from a previous question
			try { unlinkSync(answerFilePath()); } catch {}

			// Emit the question marker — Chronicle's stdout reader intercepts this.
			// The line is NOT valid JSON so pi's own JSON parser ignores it;
			// Chronicle checks for the __CQ__: prefix before attempting JSON.parse.
			const payload = JSON.stringify({
				question,
				options: options ?? [],
				allowFreeText: allow_free_text !== false, // default true
			});
			const b64 = Buffer.from(payload, "utf-8").toString("base64");
			process.stdout.write(`\n__CQ__:${b64}\n`);

			// Poll for the answer file
			const deadline = Date.now() + MAX_WAIT_MS;
			while (Date.now() < deadline) {
				await sleep(POLL_MS);
				const f = answerFilePath();
				if (existsSync(f)) {
					try {
						const raw = readFileSync(f, "utf-8");
						const { answer } = JSON.parse(raw) as { answer: string };
						try { unlinkSync(f); } catch {}
						return { content: [{ type: "text", text: answer }] };
					} catch {
						// Corrupt file — wait for a clean write
					}
				}
			}

			return {
				content: [{
					type: "text",
					text:
						"[QUESTION TIMED OUT] No answer was received within 10 minutes. " +
						"Continue with your best judgement and note the unanswered question in your output.",
				}],
			};
		},
	});
}
