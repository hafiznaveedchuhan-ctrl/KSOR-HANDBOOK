# Progress Log — Ibrahim Digital Solutions Affiliate Knowledge Base

## Milestones

- [x] KSoR initialized with `npx ksor init` (2026-09-14, commit `0d61252`).
- [x] Neon Postgres (pgvector) provisioned and connected via `KSOR_DB_URL`.
- [x] Human surface live at :3000 — Next.js + Fumadocs (**not Docusaurus**;
      corrected from the original brief — this scaffold uses
      `fumadocs-core`/`fumadocs-mdx`, no Docusaurus config exists).
- [x] MCP server live at :8080 (`ksor serve`) — confirmed listening.
- [x] Knowledge documents created: **9 total**, not 8 — 4 Amazon-affiliate
      content docs (`what-is-amazon-affiliate`, `product-hunting-guide`,
      `content-strategy`, `how-to-write-product-reviews`) + 5 KSoR-scaffold
      docs (`what-is-a-ksor`, `governance-ladder`, `surfaces/overview`,
      `surfaces/for-people`, `surfaces/for-agents`). 6 of 9 admitted to the
      machine surface (`llms.txt`/MCP) as of the last build.
- [x] Two-reader doctrine implemented on `how-to-write-product-reviews.md`:
      unheaded human-orientation intro, then H2/H3 sections written as
      agent-citable rules, sourced against the FTC endorsement guides and the
      Amazon Associates Operating Agreement.
- [x] SDD workflow established: knowledge changes go through Plan Mode
      (propose → approve → write) rather than direct edits.

## 2026-09-15 session notes

- `instance.md` scope rewritten from the generic KSoR starter text to the
  Amazon-affiliate scope.
- `how-to-write-product-reviews.md` published `status: stable`, approved by
  `human:you`.
- Fixed a stale dev-cache bug: a long-running `next dev` process plus
  `output: export` left `system/site/.source/` out of sync with newly staged
  knowledge, so `generateStaticParams()` was missing routes. Resolved by
  killing the stale process, clearing `.source` / `.staged-knowledge` /
  `.next`, and restarting — all doc routes verified 200 OK.
- Committed: `7581b5b`.

## 2026-09-16 session notes

- `CLAUDE.md`/`AGENTS.md`: `CLAUDE.md` had been expanded with project
  operational rules directly, which broke this project's own
  `ksor-pointer-changed` check (`CLAUDE.md` must stay exactly one line,
  `@AGENTS.md` — "AGENTS.md is the single contract"). Reverted `CLAUDE.md` to
  that one line and moved the operational rules (provision-once, daily
  startup, refresh-not-provision, `.env` secrecy, Plan Mode for `knowledge/`)
  into a new "Operational rules — Ibrahim Digital Solutions" section at the
  end of `AGENTS.md` instead.
- `instance.md` rescoped further: title changed to "Ibrahim Digital
  Solutions — Amazon Affiliate Knowledge Base," body now states the exact
  out-of-scope refusal wording ("This question is outside the Ibrahim
  Digital Solutions knowledge base scope.") and a language note (English +
  Roman Urdu). This body is what `ksor serve` hands every connecting MCP
  agent as its instructions, so it takes effect only after the MCP server is
  restarted.
- Tried switching the embedding provider from Gemini to OpenAI
  (`text-embedding-3-small`): `.env`/`instance.md` were updated, but
  `npm run refresh` refused with `embedding-space mismatch` — the Neon
  database already holds vectors embedded under `gemini-embedding-001`, and
  ksor refuses to mix embedding spaces in one database (a provider switch
  needs a *new* database, full re-embed, and a floor recalibration).
  **Decision: reverted to Gemini** rather than provision a second database —
  `.env`/`instance.md` restored, `npm run refresh` re-ran clean (0 chunks
  re-embedded, just a pointer flip to generation 5). The OpenAI key the user
  provided is kept commented out in `.env` for a future attempt.
- Fixed a missing trailing newline in `instance.md` (cosmetic/lint hygiene,
  not a `format-checker` failure).

## Open items

- `.ksor/governance.yaml` approval authority is still the placeholder actor
  `human:you` — the intake interview that resolves it to a real handle
  hasn't run yet.
- `.ksor/people.yaml` has no display names registered.
- If OpenAI embeddings are wanted later: needs a second Neon database
  (separate `KSOR_DB_URL`), `npm run provision` on it, a full re-ingest
  (paid, unlike Gemini's free tier), and `npx ksor calibrate` for a fresh
  trust floor.
