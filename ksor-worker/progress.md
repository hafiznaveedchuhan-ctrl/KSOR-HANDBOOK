# Progress — ksor-worker

## 2026-09-16 — Initial build

Built per plan.md: uv project init, deps (`openai-agents`, `python-dotenv`),
governance docs (CLAUDE.md, spec.md, plan.md, tasks.md,
docs/adr/001-use-openai-agents-sdk.md), and the three source files
(`common.py`, `worker.py`, `compare.py`).

**Verified:**
- `uv run python -c "import ksor_worker.worker, ksor_worker.compare"` —
  both modules import cleanly (correct absolute-import shape, matches
  `uv run python src/ksor_worker/worker.py` invocation).
- `worker.py`'s MCP connection path, run directly against the live
  `ksor serve` at `http://127.0.0.1:8080/mcp`: connected successfully and
  listed its tools — `['search', 'outline', 'read']`, matching what
  handbook's AGENTS.md documents as the KSOR gateway's default tool surface.

**Not yet verified (needs a real `OPENAI_API_KEY`, which no agent can
provide):**
- An actual grounded vs. ungrounded model answer. `.env` has not been
  created — only `.env.example` exists. Once a real key is in `.env`,
  run both scripts interactively:
  ```sh
  uv run python src/ksor_worker/worker.py
  uv run python src/ksor_worker/compare.py
  ```
  Ask the same in-scope question (e.g. "What is the Amazon affiliate
  program?") to both, then the same out-of-scope question, and compare the
  four answers as described in spec.md's verification section.

## 2026-09-16 — Live verification, bug found and fixed

Real `OPENAI_API_KEY` supplied and moved into `ksor-worker/.env`.

**Bug found:** `worker.py`'s first `search` call failed with
`MCPError: Request 'tools/call' timed out`. Root cause: the SDK's
`MCPServerStreamableHttp` defaults `client_session_timeout_seconds=5`, too
short for a real embedding-backed search (Gemini embed + pgvector query).
The SDK swallowed the timeout as a generic "MCP tool returned an error" tool
result, and the model answered from its own memory instead — silently
breaking the "KSOR-only" guarantee.

**Fix:** added `MCP_TIMEOUT_SECONDS = 30` to `common.py` and passed
`client_session_timeout_seconds=MCP_TIMEOUT_SECONDS` in `worker.py`.

**Re-verified after the fix:**
- `worker.py` on "What is the Amazon affiliate program?" — no error,
  answered with FTC-disclosure specifics matching a real indexed document
  (`how-to-write-product-reviews`), confirmed by calling the `search` tool
  directly and inspecting the raw hit.
- `worker.py` on "Who won the cricket world cup?" — correctly abstained:
  "outside the knowledge base's scope."
- `compare.py` on the same two questions (no MCP tools) — answered the
  affiliate question from generic pretrained knowledge (no document-specific
  detail), and merely *mimicked* a scope refusal on the cricket question
  without any real grounding check — the exact contrast the demo exists to
  show.

Both workers are verified working as specified.

## 2026-09-16 — compare.py prompt changed: general, unrestricted assistant

User asked to remove the KSOR restriction from `compare.py`'s system prompt —
it should be a general Amazon affiliate assistant, answering freely, no
scope limit, still no MCP tools.

**Change:** `compare.py` no longer imports `INSTRUCTIONS` from `common.py`.
It now defines its own local, unrestricted prompt. `worker.py` and
`common.py` are unchanged — `common.INSTRUCTIONS` is now understood as
worker.py's prompt specifically, not a shared one. `MODEL` stays shared from
`common.py` for both.

Updated `CLAUDE.md` (rules 1–2) and `spec.md` (Components, System prompts,
compare.py behavior) to match — the old "same prompt, tools are the only
variable" framing no longer describes the code.

**Re-verified:** `compare.py` on "What is the Amazon affiliate program?" —
answered freely with no scope disclaimer and no reference to any knowledge
base, as intended.

## 2026-09-16 — User re-test: false alarm, stale process

User tested `compare.py` with two questions ("Pakistan ka current prime
minister kaun hai" and the cookie-window question) and got a KSOR-style
refusal on the first one ("...Ibrahim Digital Solutions ki Amazon affiliate
knowledge base ke daira-e-kam se bahar hai") — looked like the unrestricted
prompt change hadn't taken effect.

**Investigated:** re-ran `compare.py` fresh with the exact same two
questions — answered both freely (Pakistan PM from pretrained knowledge with
a knowledge-cutoff caveat; cookie window generically), no refusal, no
knowledge-base reference. The current file is correct.

**Root cause:** not a code bug — the user's terminal was almost certainly
still running an interactive `compare.py` session started *before* the
prompt change. A running Python process doesn't reload edited source; only a
fresh `uv run` picks up the new `INSTRUCTIONS`.

**Resolution:** user restarted the script fresh and confirmed it now answers
correctly ("hogyaha bhai"). No code change needed — closing this out.
