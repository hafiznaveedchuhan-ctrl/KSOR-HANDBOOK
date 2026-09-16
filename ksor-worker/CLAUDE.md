# CLAUDE.md — ksor-worker

Read spec.md, plan.md, tasks.md, and docs/adr/001-use-openai-agents-sdk.md
before making any change here.

1. Purpose: contrast grounded vs ungrounded — worker.py (KSOR MCP-connected,
   scoped strictly to the KSOR knowledge base) vs compare.py (no tools, a
   general Amazon affiliate assistant with no scope restriction, answering
   from its own knowledge). They intentionally run different system prompts
   now — worker.py's is KSOR-scoped, compare.py's is open — so this is a
   grounded-and-restricted vs ungrounded-and-unrestricted contrast, not a
   same-prompt-different-tools one. Both still use the same `MODEL` from
   common.py.
2. `common.py` is the single source for `MODEL` and for worker.py's
   `INSTRUCTIONS` (its KSOR-scoped prompt) — never duplicate either.
   compare.py deliberately keeps its own `INSTRUCTIONS` (general, unscoped)
   defined locally, not in common.py — do not merge it back into a shared
   constant without the user asking for that again.
3. worker.py must never answer from the model's own memory when the KSOR
   tools return nothing relevant — print the abstention text exactly as the
   tool call returns it, no rewriting.
4. Never commit .env — it holds OPENAI_API_KEY. .env.example stays a bare
   placeholder.
5. Python 3.12, managed with uv only — no pip/poetry/conda commands here.
6. After any change that completes or alters a task, update tasks.md and
   append a line to progress.md. Don't let either drift from the code.
