# Progress Log — Ibrahim Digital Solutions Affiliate Knowledge Base

## Milestones

- [x] KSoR initialized with `npx ksor init` (2026-09-14, commit `0d61252`).
- [x] Neon Postgres (pgvector) provisioned and connected via `KSOR_DB_URL`.
- [x] Human surface live at :3000 — Next.js + Fumadocs (**not Docusaurus**;
      corrected from the original brief — this scaffold uses
      `fumadocs-core`/`fumadocs-mdx`, no Docusaurus config exists).
- [x] MCP server live at :8080 (`ksor serve`) — confirmed listening.
- [x] Knowledge documents: **12 total** as of 2026-09-21 — 7
      Amazon-affiliate content docs (`what-is-amazon-affiliate`,
      `product-hunting-guide`, `content-strategy` — all still `draft` —
      plus `how-to-write-product-reviews`, `product-sourcing`,
      `product-listing`, `refund-policy`, all `stable`/approved) + 5
      KSoR-scaffold docs (`what-is-a-ksor`, `governance-ladder`,
      `surfaces/overview`, `surfaces/for-people`, `surfaces/for-agents`,
      all `stable`). 9 of 12 admitted to the machine surface
      (`llms.txt`/MCP) as of generation 7 (2026-09-21) — the 3 still-draft
      Amazon docs are the only ones held back.
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

## 2026-09-16/17 session notes — `ksor-worker` briefly lived here, then split out

- Built a separate demo project, `ksor-worker` (Python/uv, OpenAI Agents
  SDK), at `~/ksor-worker` — two AI workers (`/ask` grounded via this
  record's MCP server, `/compare` ungrounded) proving what grounding buys
  you. Full detail lives in that project's own `progress.md`, not
  duplicated here — this entry covers only what touched `handbook`.
- `ksor-worker` was copied into `handbook/ksor-worker/` and pushed to this
  same GitHub repo (`c4ebc7f`), along with its own CI workflow
  (`9be97a1`) — a decision made when the two projects were still going to
  share one repo.
- **A Vercel project (`hafiznaveedchuhans-projects/ksor-worker`) auto-linked
  to this GitHub repo and tried to deploy the copied `ksor-worker/` folder
  as a Python web app**, failing every push with "No python entrypoint
  found" — correct, since `worker.py`/`compare.py` were interactive CLI
  scripts (`input()` loops) at that point, with no HTTP entrypoint at all.
  Diagnosed via the Vercel API/MCP tools (`GET .../commits/{sha}/status`
  showed the real `Vercel` context failing, not either GitHub Actions
  check), documented in `64d0136`. The user deleted the Vercel project from
  its dashboard once diagnosed (I don't have permission to pause/delete
  Vercel projects programmatically — tried, got `403`).
- **Decision, per the user's explicit production-deployment plan (Vercel or
  Render for `ksor-worker`, this record's own path for `handbook`):
  `handbook` and `ksor-worker` must be genuinely separate GitHub repos —
  no shared repo, no copies.** Removed `handbook/ksor-worker/` and its
  orphaned CI workflow (`b790e24`) — nothing under `knowledge/` or
  `system/` was touched by this. `ksor-worker` now lives in its own
  separate repository (see its own `docs/adr/` for why).
- A GitHub Personal Access Token was pasted into chat and briefly landed in
  the wrong place — a commented-out `# OPENAI_API_KEY=` line in this
  repo's own `.env` (line 20) had a value appended after it without
  uncommenting the line. Moved into `ksor-worker/.env` (where it's
  actually used) and the line here restored to its harmless commented
  form. `.env` is gitignored either way, so this was never committed, but
  worth recording since the token was exposed in a chat transcript — the
  user was told to revoke/rotate it independent of this fix.

## 2026-09-21 session notes — 3 more Amazon-affiliate documents, and an ingest bug

- Added three new `status: stable`, `human:you`-approved documents, all
  within `instance.md`'s existing Amazon-affiliate scope (confirmed with
  the user before writing — a generic/company refund policy would have
  been out of scope; this instead covers Amazon's *own* return/refund
  mechanics and their effect on affiliate commissions):
  - `knowledge/product-sourcing.md` — sourcing product images/data
    correctly (SiteStripe vs. PA-API vs. manual), licensing rules, keeping
    data fresh.
  - `knowledge/product-listing.md` — the anatomy of a converting listing
    block, formats, ranking disclosure, a converts-vs-kills table.
  - `knowledge/refund-policy.md` — how a return reverses a commission, the
    payout holding period, return windows (deliberately not asserting
    exact category day-counts not confidently sourced).
  - Committed as `c578f59`. `npm run check` passed clean on all three.
- **Bug found in `ksor ingest --flip` itself, not in the documents**: the
  first ingest run built generation 6 with all three new documents
  embedded and reported success, but its output was silently missing the
  "pre-flip delta"/"FLIPPED active generation" lines that a normal
  successful flip prints — meaning generation 6 was built but **never
  actually activated**. The live MCP server kept serving generation 5 with
  no error of any kind: `read`/`search` calls for the new documents
  returned "no document with slug," even after a full `ksor serve`
  restart (ruled out any in-memory caching — confirmed from the installed
  package's own source that `active_generation` is read from the
  `corpora` table fresh on every query, not cached at boot). A second,
  identical `ksor ingest --flip` (generation 7) printed the expected
  `FLIPPED active generation -> 7` and the three new slugs under "added,"
  and every document became immediately readable and correctly ranked in
  search. **Root cause of the first run's silent non-flip was not fully
  identified** — recorded here as something to watch for: if a future
  ingest's output doesn't show a delta/flip confirmation line, assume it
  did NOT activate and re-run before trusting the new content is live.
- This record's MCP server (`ksor serve`) was also found running via a
  process over an hour old at one point mid-session, serving a stale
  generation — restarted as part of diagnosing the above. Not itself a bug
  (restarting periodically after an ingest is normal hygiene), but the
  actual root cause turned out to be the flip issue above, not staleness
  from the long-running process.
- **`ksor-worker` gained a `/refund` endpoint with real conversation
  memory** (separate repo — see its own `progress.md` and
  `docs/adr/003-refund-agent-memory.md` for the full build, including a
  domain-split reliability bug found and fixed there). Relevant here only
  because of what it needed from this repo: `refund-policy.md` (above) as
  groundable content, and confirmation that a refund question asked
  through this record's *general* MCP-connected agent gets declined in
  favor of the dedicated refund agent — a prompt-only version of that
  exclusion was tested and found unreliable (answered a refund question
  directly on 3/3 calls); the working fix is a deterministic keyword check
  in `ksor-worker`'s own code, not anything in this record.
- **Added a floating refund-assistant chat widget**, global on every page
  (`system/site/components/refund-widget.tsx`, mounted in `app/layout.tsx`,
  commit `c9a815e`). It calls `ksor-worker`'s `/refund` endpoint directly
  from the browser — this site is a static export (`output: "export"`,
  confirmed in `next.config.mjs`) with no live Next server at runtime, so a
  conventional API route can't proxy the request; CORS on `ksor-worker`'s
  side is what makes the direct browser call possible instead.
  - Building the one missing shadcn primitive (`npx shadcn@latest add
    input`) pulled in an unwanted `cn` npm package and generated code
    importing from it (`import { cn } from "cn"`) instead of this
    codebase's own `@/lib/utils` — inconsistent with every other
    component here. Fixed the import and reverted the unwanted dependency
    (`npm install` after removing it from `package.json` to resync the
    lockfile) before committing.
  - Verified: `tsc --noEmit` clean; a fresh `npm run dev` (after killing a
    stale dev server left running from earlier in the session — a second
    `next dev` refuses to start on an occupied port rather than silently
    picking up code changes on the old one) served the widget's launcher
    markup on the homepage; a real browser-shaped `OPTIONS` preflight
    request against `ksor-worker`'s `/refund` (the actual cross-origin
    call the widget makes) returned the correct
    `access-control-allow-origin` for `http://localhost:3000`. Not
    verified: an actual click-through in a real browser — no browser
    automation tool was available in this session, so this is wiring-level
    verification, not a substitute for opening it and using it once.
  - `AGENTS.md`'s "Operational rules" section now documents this as a
    third required local-dev process, and `NEXT_PUBLIC_KSOR_WORKER_URL`
    as the build-time env var pointing the widget at a non-default
    backend URL.

## 2026-09-21 (continued) — Strict cross-repo audit

User requested a ruthless, evidence-driven audit of both repos
(`handbook` + `ksor-worker`) against everything built this session,
scored out of 100, driven to a genuine 100 — not inflated. Full findings
and both real bugs fixed are recorded in `ksor-worker`'s own
`progress.md` (a `refund_agent` citation-fabrication bug and an
abstention-wording inconsistency, both in that repo's code, both fixed
and re-verified live) — not duplicated here.

**What this audit re-confirmed about `handbook` specifically, with fresh
evidence, not assumed:**
- `npm run check` — clean.
- All 3 new knowledge documents (`product-sourcing`, `product-listing`,
  `refund-policy`) live-readable via a fresh MCP `read` call and
  correctly top-ranked in a fresh `search`, re-proven after `ksor serve`
  was stopped and restarted mid-audit.
- `git log -p --all` grepped for secret patterns across this repo's
  entire history — clean; `.env` never committed at any point.
- CI green on current `HEAD` (`Format checker` — success), checked live
  via the GitHub API.
- Working tree clean, no leftover `ksor-worker/` copy.

**One small, genuine gap found and fixed here:** `README.md` (717 lines,
the generic KSoR-scaffold onboarding doc) had a stray leftover `# KSOR-HANDBOOK`
heading dangling at the very end — the same class of GitHub-auto-init
merge artifact found and removed from `ksor-worker`'s README in the same
audit. Removed. (Not otherwise mentioning the refund widget/agents was
judged NOT a gap — that's `AGENTS.md`'s job, already updated earlier this
session, and `README.md` is the generic scaffold doc, not the
project-specific operational contract.)

**Final score across both repos: 98/100** — the 2 real bugs this audit
found (both in `ksor-worker`'s code — a fabricated citation URL and an
inconsistent abstention wording, full detail in that repo's own
`progress.md`) are fixed and re-verified live; the single 2-point
deduction (Widget & UI) is a session tooling constraint — no browser
automation available or installable here, confirmed directly — not a
defect in this repo or the widget itself. Offered to attempt installing
Playwright to close it; the user chose to keep 98/100 rather than add a
new dependency for a 2-point gain, since the wiring/rendering evidence
already gathered is strong and a visual check takes them under a minute.

Committed and pushed as `442ee92`; `ksor-worker`'s corresponding commits
are `cc8c681`/`9dff20e`. Both repos' CI confirmed green on these commits
via the GitHub API before reporting the final score.

## 2026-09-21 (continued) — Widget generalized, no longer refund-only

User asked for the widget to answer from every agent, not just refunds.
Clarified: one unified general assistant, not a selector or side-by-side
comparison. Full backend design (`general_agent.py`, `/chat`) is in
`ksor-worker`'s own `progress.md` — this entry covers only what changed in
this repo.

`system/site/components/refund-widget.tsx` **renamed** to
`assistant-widget.tsx` (`RefundWidget` → `AssistantWidget`) — the old name
would have actively misled once the component stopped being refund-only.
Fetch target switched from `ksor-worker`'s `/refund` to its new `/chat`
endpoint (general, no topic split, still has memory). Header/placeholder/
aria-label copy generalized to match. `app/layout.tsx`'s import updated.

Verified: `tsc --noEmit` clean; the live dev server's rendered homepage
HTML shows the new `aria-label="Open assistant"` on the launcher; a fresh
CORS preflight against `/chat` (not just the old `/refund`) returns the
correct `access-control-allow-origin` for this site's origin.
`AGENTS.md`'s widget note updated to name `/chat` specifically.

## Open items

- `.ksor/governance.yaml` approval authority is still the placeholder actor
  `human:you` — the intake interview that resolves it to a real handle
  hasn't run yet.
- `.ksor/people.yaml` has no display names registered.
- If OpenAI embeddings are wanted later: needs a second Neon database
  (separate `KSOR_DB_URL`), `npm run provision` on it, a full re-ingest
  (paid, unlike Gemini's free tier), and `npx ksor calibrate` for a fresh
  trust floor.
