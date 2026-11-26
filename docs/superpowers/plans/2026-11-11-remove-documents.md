# Remove the documents module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@sjvair/sdk` no longer contains or exports the documents client; docs
say where it went.

**Architecture:** Pure deletion plus doc edits. No code outside `lib/documents/`
changes.

**Tech Stack:** Deno 2.x, JSR (`deno publish`), zod.

**Spec:** `docs/superpowers/specs/2026-11-11-remove-documents-design.md`

## Global Constraints

- Branch `feature/remove-documents` (from `origin/release/5.0.0`, 819d152, with
  5008716 and the spec commit on top). PR into `release/5.0.0`.
- `lib/http/` and every other module stay byte-for-byte unchanged.
- No tag, no `deno publish` (only `--dry-run`), no merge. Merge waits for the
  dashboard's copy in data-dashboard `main`, the coordinator's go, and the
  user's yes.
- Never run `lib/account/mod_test.ts` (writes the shared DB, sends a text).
- Never print `.env` values (the documents sign-in uses the WORKSPACE_E2E_*
  account).
- No Claude or AI attribution in commits, PR text or docs.
- Older specs and plans under `docs/superpowers/` are not edited.

## Review Focus

- A consumer importing `@sjvair/sdk/documents` from a new beta should get a
  clear "not exported" failure, not a half-present module: all seven `exports`
  entries go (checked by `deno publish --dry-run` and the grep in Task 2).
- The root `@sjvair/sdk` import must still type-check with every other module:
  `deno check mod.ts` in Task 1.
- `@sjvair/sdk/http` exports unchanged:
  `git diff origin/release/5.0.0 --
  lib/http` is empty (Task 3).
- Shared test helpers (`lib/http/fetch_stub_test_utils.ts`) stay, because other
  tests use them: Task 1 deletes only `lib/documents/`.
- The CHANGELOG still reads correctly for beta.1–beta.8 users: Task 2's Breaking
  line names the betas that had it.

---

### Task 1: Remove the code and exports

**Files:**

- Delete: `lib/documents/` (11 files)
- Modify: `deno.json` (the seven `"./documents…"` lines in `exports`)
- Modify: `mod.ts:105` (`export * from "./lib/documents/mod.ts";`)

- [ ] **Step 1:** `git rm -r -q lib/documents`
- [ ] **Step 2:** Delete the seven `./documents` export lines from `deno.json`
      and the re-export line from `mod.ts`.
- [ ] **Step 3: Verify.** Run
      `deno check mod.ts && deno lint && deno publish --dry-run --allow-dirty`.
      Expected: no errors; the dry-run file list has no `lib/documents/` path.
- [ ] **Step 4: Commit**
      `git add deno.json mod.ts && git commit -m "Remove the documents module"`.

### Task 2: Docs

**Files:** `README.md`, `CLAUDE.md` (test env table), `.env.template`,
`api-urls.md`, `CHANGELOG.md`, `DEFERRED.md`

- [ ] **Step 1: README.** Replace from `### Documents` through the
      `listDocuments({ since })` paragraph (the line before the next heading or
      end of file) with:

  ```md
  ### Documents

  The documents client (`@sjvair/sdk/documents`, the data dashboard's saved
  dashboards) moved into the public
  [data-dashboard](https://github.com/SJVAir/data-dashboard) repo, built on
  `@sjvair/sdk/http`. 5.0.0-beta.8 is the last SDK version with it.
  ```

- [ ] **Step 2: CLAUDE.md / .env.template.** Remove the four `TEST_DOCUMENTS*`
      table rows, and the `# Documents integration test …` comment plus its
      three variables.
- [ ] **Step 3: api-urls.md.** Remove the `## Documents` section, up to
      `## HMS Smoke and Fire`.
- [ ] **Step 4: CHANGELOG.md (5.0.0).** Remove the Added line "The documents
      module (private; …)" (two lines) and the whole `### Planned for 5.0.0`
      section. In "Betas:", change "everything below except "Planned" and the
      entry-bounds change" to "everything below except the entry-bounds change
      and the documents removal". Add as the last Breaking item:

  ```md
  - `@sjvair/sdk/documents` is removed. It shipped only in prereleases
    (4.8.0-beta.2 to 5.0.0-beta.8); the client moved into the data-dashboard repo
    (decided 2026-11-11). See "What belongs in the SDK" in `CLAUDE.md`.
  ```

  The PR number is added after the PR opens (Task 3).

- [ ] **Step 5: DEFERRED.md.** Delete the "Move the documents module out of the
      public SDK" entry; under `## Before 5.0.0 final` write `None open.`
- [ ] **Step 6: Verify.** `deno fmt` then `deno fmt --check`. Then
      `grep -rn -i documents . --exclude-dir=.git --exclude-dir=.worktrees --exclude-dir=superpowers`
      Expected hits only: the README section, the CHANGELOG Breaking line, the
      CLAUDE.md rule's example (and the CHANGELOG Betas phrase "documents
      removal").
- [ ] **Step 7: Commit** `docs: documents moved into data-dashboard`.

### Task 3: Verify, PR, hand-off

- [ ] **Step 1:** `git diff --stat origin/release/5.0.0 -- lib/http` → empty.
- [ ] **Step 2:** Local stack up (`curl -sf http://127.0.0.1:8000/api/2.0/` ),
      then
      `deno test --allow-net --allow-env --allow-read --env-file=.env --ignore=lib/account`.
      Expected: all pass; skips only the known local-data notes. A failure that
      looks like missing local data is checked before being called a bug.
- [ ] **Step 3:** `git push -u origin feature/remove-documents`; open the PR
      into `release/5.0.0`: summary, the rule, the check/test results, and "Do
      not merge until the dashboard's copy is merged into data-dashboard main,
      the coordinator has checked its inventory, and the user says yes."
- [ ] **Step 4:** Put the PR number on the CHANGELOG Breaking line, commit
      (`CHANGELOG: PR number`), push.
- [ ] **Step 5:** SendMessage the PR link to `data-dashboard-8a`, noting
      `@sjvair/sdk/http` is unchanged.
