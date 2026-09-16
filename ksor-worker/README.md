# ksor-worker

Two small AI workers that prove, side by side, what grounding actually buys
you — one answers **only** from the Ibrahim Digital Solutions Amazon
affiliate knowledge base (via MCP), the other answers **freely** from its
own general knowledge with no restriction at all. Ask both the same
question and watch the difference.

Built on the [OpenAI Agents SDK](https://github.com/openai/openai-agents-python),
talking to a [KSOR](https://github.com/panaversity/ksor) knowledge record
over MCP.

## How it works

```
                 ┌─────────────────────┐
  You  ───────▶  │   worker.py         │  (grounded, KSOR-scoped)
  ask a          │   OpenAI Agent      │
  question       └─────────┬───────────┘
                            │ MCP tool call ("search")
                            ▼
                  ┌───────────────────┐
                  │  ksor serve (MCP) │  http://127.0.0.1:8080/mcp
                  └─────────┬─────────┘
                            │ 1. embed the query   → Gemini
                            │ 2. similarity search → Neon (pgvector)
                            │ 3. floor check        → abstain or return hits
                            ▼
                  raw matching document text
                            │
                            ▼
                  OpenAI (gpt-4o-mini) writes the final answer
                            │
                            ▼
                       printed to you

  You  ───────▶  compare.py — same question, NO MCP, NO tools.
  ask the        Answers straight from the model's own training —
  same           general Amazon affiliate knowledge, unrestricted.
  question
```

**The point:** `worker.py` can only say what the knowledge base actually
contains, and says so plainly when it doesn't cover something. `compare.py`
will confidently answer anything — right or wrong, in scope or not — because
nothing is checking it against a source.

## The two workers

| | `worker.py` | `compare.py` |
|---|---|---|
| Tools | KSOR MCP (`search`, `outline`, `read`) | none |
| System prompt | KSOR-scoped — refuses what the record doesn't cover | general Amazon affiliate assistant, no restriction |
| Answers from | the actual knowledge base, retrieved live | the model's own training data |
| Model | `gpt-4o-mini` | `gpt-4o-mini` |

Both share the same `MODEL` (see `src/ksor_worker/common.py`) so the model
itself is never a variable in the comparison — only tool access and scope
are.

## Setup

Requires [uv](https://docs.astral.sh/uv/) and Python 3.12.

```sh
git clone <this repo>
cd ksor-worker
uv sync
cp .env.example .env
```

Edit `.env`:

```
OPENAI_API_KEY=sk-...
```

`worker.py` also needs a running KSOR MCP server (defaults to
`http://127.0.0.1:8080/mcp`, overridable with `KSOR_MCP_URL`). See the
[handbook](../handbook) project for how to bring `ksor serve` up.

## Run

```sh
uv run python src/ksor_worker/worker.py     # grounded, KSOR-scoped
uv run python src/ksor_worker/compare.py    # ungrounded, unrestricted
```

Each opens an interactive loop — type a question, get an answer, type
`exit` to quit.

**Try the same question on both**, e.g. *"What is the Amazon affiliate
program?"* — then ask something the knowledge base doesn't cover, e.g. *"Who
won the cricket world cup?"* `worker.py` will say it's outside scope;
`compare.py` will just answer.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | — | OpenAI API access for both workers |
| `KSOR_MCP_URL` | no | `http://127.0.0.1:8080/mcp` | where `worker.py` looks for the KSOR MCP server |

## Project layout

```
src/ksor_worker/
├── common.py    # shared MODEL, KSOR_MCP_URL, MCP_TIMEOUT_SECONDS, and worker.py's INSTRUCTIONS
├── worker.py    # grounded worker — connects to KSOR over MCP
└── compare.py   # ungrounded worker — its own unrestricted prompt, no tools
docs/adr/        # why the OpenAI Agents SDK was chosen
spec.md          # full technical spec
plan.md          # build phases
tasks.md         # task tracker
progress.md      # build log, including a real bug found and fixed during verification
CLAUDE.md        # working rules for this project
```

## A real bug this project already hit (and fixed)

The OpenAI Agents SDK's `MCPServerStreamableHttp` defaults to a **5-second**
tool-call timeout — too short for a real embedding-backed search (Gemini
embed + pgvector query). When it timed out, the SDK quietly turned that into
a generic tool error, and the model answered from its own memory instead —
silently breaking the "KSOR-only" guarantee `worker.py` exists to enforce.

Fixed by raising it explicitly: `MCP_TIMEOUT_SECONDS = 30` in `common.py`,
passed as `client_session_timeout_seconds` to `MCPServerStreamableHttp`. Full
writeup in `progress.md`. Worth knowing if you build your own MCP-backed
agent and get answers that don't match what your record actually contains —
check for a swallowed timeout before you doubt your retrieval.

## Read next

Start with `CLAUDE.md`, then `spec.md`, `plan.md`, and `docs/adr/001-use-openai-agents-sdk.md`
for the full design reasoning; `tasks.md` and `progress.md` track what's
been built and verified.
