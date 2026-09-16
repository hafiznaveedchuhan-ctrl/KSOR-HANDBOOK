# Plan — ksor-worker

1. `uv init --package` + `uv add openai-agents python-dotenv` + `.env.example`
   + `.gitignore`.
2. Write CLAUDE.md, spec.md, plan.md (this file), tasks.md,
   docs/adr/001-use-openai-agents-sdk.md.
3. `src/ksor_worker/common.py` — MODEL, INSTRUCTIONS, KSOR_MCP_URL.
4. `src/ksor_worker/worker.py` — grounded loop.
5. `src/ksor_worker/compare.py` — ungrounded loop.
6. Verify: `uv run python src/ksor_worker/worker.py` and
   `uv run python src/ksor_worker/compare.py` — one in-scope question, one
   out-of-scope question, compare the four answers.
7. Update tasks.md (mark done) and progress.md (append a dated entry).
