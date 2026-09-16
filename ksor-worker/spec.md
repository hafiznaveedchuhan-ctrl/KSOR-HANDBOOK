# Spec — ksor-worker

## Goal
A side-by-side demo: the same user question answered twice — once grounded
and scoped to the Ibrahim Digital Solutions Amazon affiliate KSoR via MCP,
once by a general, unrestricted Amazon affiliate assistant with no tools and
no scope limit — so the gap between the two answers is visible in one
terminal session each.

## Components
- `src/ksor_worker/common.py` — shared, single-source: `MODEL`,
  `KSOR_MCP_URL`, `MCP_TIMEOUT_SECONDS`, and `INSTRUCTIONS` (worker.py's
  KSOR-scoped prompt only).
- `src/ksor_worker/worker.py` — grounded, KSOR-scoped worker. Imports
  `INSTRUCTIONS` from `common.py`.
- `src/ksor_worker/compare.py` — general, unrestricted worker. Defines its
  own `INSTRUCTIONS` locally (not shared with worker.py, on purpose).

## Model
`gpt-4o-mini` for both workers, imported from `common.py` — kept identical so
the model itself is never a variable in the comparison.

## System prompts (two, by design)
- **worker.py** (`common.INSTRUCTIONS`): casts the agent as the Amazon
  affiliate assistant for Ibrahim Digital Solutions, instructed to answer
  only from the KSOR knowledge base and to say plainly when a question falls
  outside it rather than guessing.
- **compare.py** (its own local `INSTRUCTIONS`): a general Amazon affiliate
  marketing assistant with no scope restriction and no knowledge-base
  reference — free to answer from its own training knowledge.

  This is a deliberate change from the demo's first cut, where both workers
  shared the exact same "KSOR-only" prompt to show the *model itself*
  can't honor a scope restriction without tools. The current design instead
  contrasts two distinct assistants — grounded-and-restricted vs
  general-and-unrestricted — which is closer to how these two worker types
  would actually be deployed.

## worker.py behavior
- Loads `.env` (`python-dotenv`).
- Opens `agents.mcp.MCPServerStreamableHttp(name="KSOR", params={"url":
  KSOR_MCP_URL})` as an async context manager for the life of the session.
- **On "stateless": there is no `stateless=` constructor argument in the
  OpenAI Agents SDK's `MCPServerStreamableHttp`** (verified against the
  library's own docs before writing this spec) — inventing one would silently
  no-op or crash. What the requirement actually describes is the
  streamable-HTTP MCP transport's own behavior: each tool call is an
  independent HTTP request — no server-side session is required for it to
  work correctly. That property is inherent to the transport, not a flag to
  set — recorded here so it isn't accidentally "fixed" by adding a
  nonexistent kwarg.
- Builds one `Agent(name="KSOR Worker", instructions=INSTRUCTIONS,
  model=MODEL, mcp_servers=[ksor_server])`.
- Loops: `input()` → `await Runner.run(agent, query)` → prints
  `result.final_output` verbatim (this is also how KSOR's own abstention
  wording — the "not in this record" text — passes through unedited).
  `exit`/`quit` ends the loop.

## compare.py behavior
- Its own local `INSTRUCTIONS` (general, unrestricted), same `MODEL` from
  `common.py`, **no** `mcp_servers` argument.
- Same `input()` loop, same `Runner.run`, prints the raw answer.

## Environment
- `OPENAI_API_KEY` — required, from `.env`.
- `KSOR_MCP_URL` — optional override, defaults to
  `http://127.0.0.1:8080/mcp` (assumes `ksor serve` is already running
  locally with `KSOR_AUTH=disabled-local`, per handbook's own dev setup — no
  auth headers are sent).

## Non-goals
No multi-turn memory beyond a single exchange, no persistence, no auth
handling beyond the local dev posture above, no packaging/publishing.
