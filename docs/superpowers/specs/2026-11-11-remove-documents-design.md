# Remove the documents module from the public SDK

_2026-11-11. For the data dashboard. Branch `feature/remove-documents` from
`release/5.0.0` (819d152), PR into `release/5.0.0`. The branch already has
5008716 ("docs: what belongs in the public SDK"), which adds the placement rule
this spec cites; it is part of the same PR._

## Why

`@sjvair/sdk/documents` wraps the private `/api/2.0/documents/` endpoints: the
data dashboard's saved dashboards. The user decided on 2026-11-11 that it moves
into the data-dashboard repo itself, not into a separate internal package:
data-dashboard, sdk-js and sjvair.com are all public on GitHub, and the client
ships in the dashboard's JavaScript anyway, so a private package would hide
nothing and would need read tokens in CI, local dev and sjvair.com's Heroku
build. (data-dashboard `DEFERRED.md`, "Moving the documents SDK code out of the
public `@sjvair/sdk` before go-live", 1be5b86.)

It follows the rule in `CLAUDE.md` → "What belongs in the SDK" (the user,
2026-11-11): the SDK wraps SJVAir's shared API (public data and site-wide
account features); an endpoint that backs only one app's own feature, where that
app decides what the data looks like and is its only caller, lives in that app,
built on `@sjvair/sdk/http`. The dashboard is documents' only caller (checked
2026-11-11 across mobile, monitor-map, map-sdk and data-dashboard, including
mobile's `export * from "@sjvair/sdk"` in `src/lib/api.ts`), and the SDK doesn't
validate a document's `body`, because only the dashboard knows its shape.
`account` stays: mobile, monitor-map and data-dashboard all call it.

The module shipped only in prereleases (4.8.0-beta.2 through 5.0.0-beta.8;
jsr.io's `latest` is 4.7.0), so removing it before 5.0.0 final breaks no stable
release. Once 5.0.0 final shipped with it, removal would wait for 6.0.

## The other half

A separate data-dashboard session copies the module from sdk-js 819d152 into the
dashboard. Its PR carries an inventory of every export and test case at 819d152
and where each went. The code is never lost: it stays in sdk-js history (819d152
and earlier) and in the published, immutable `5.0.0-beta.8`, which the dashboard
pins exactly.

## Goals

- `@sjvair/sdk` no longer contains or exports the documents client.
- Readers learn where it went (one README line; data-dashboard is public).
- The 5.0.0 change notes say it was removed.
- `@sjvair/sdk/http` is unchanged: the dashboard's copy builds on `httpRequest`,
  `RequestOptions`, `APIRequestConfig`, `setOrigin` and the request defaults.

## Non-goals and anti-goals

- No change to `lib/http/` or any other module. No other exports change.
- No change to data-dashboard, map-sdk, monitor-map, mobile or sjvair.com.
- No release, tag or publish. The removal rides along with the next beta
  (`5.0.0-beta.9`), which needs the user's own yes when it comes.
- Not rewriting history: older specs and plans under `docs/superpowers/` that
  mention documents or `--ignore=lib/documents` stay as they are.
- Failure even if the code works: the PR merges before the dashboard has its own
  copy.

## What changes

1. **Code**: delete `lib/documents/` (all 11 files: `call.ts`, `documents.ts`,
   `profile.ts`, `refusal.ts`, `schema.ts`, `sharing.ts`, `snapshots.ts`,
   `types.ts`, `mod.ts`, `documents_test.ts`, `mod_test.ts`). Nothing else in
   `lib/` imports them.
2. **`deno.json`**: remove the seven `./documents…` entries from `exports`.
3. **`mod.ts`**: remove `export * from "./lib/documents/mod.ts";`.
4. **README**: replace the "Documents" section (heading through the
   `listDocuments({ since })` paragraph) with a short section saying the
   documents client moved into the public data-dashboard repo
   (https://github.com/SJVAir/data-dashboard), built on `@sjvair/sdk/http`, and
   that 5.0.0-beta.8 is the last SDK version with it.
5. **`CLAUDE.md`**: remove the four `TEST_DOCUMENTS*` rows from the test
   environment table. **`.env.template`**: remove the documents comment and its
   three variables.
6. **`api-urls.md`**: remove the "Documents" section. The file tracks what the
   SDK implements, and the SDK no longer implements these.
7. **`CHANGELOG.md`** (5.0.0):
   - remove the "The documents module (private; …)" line under Added;
   - remove the "Planned for 5.0.0" section (its only line is this move);
   - add under Breaking, following the `exact` precedent:
     `@sjvair/sdk/documents` is removed. It shipped only in prereleases
     (4.8.0-beta.2 to 5.0.0-beta.8); the client moved into the data-dashboard
     repo (the user, 2026-11-11). With the PR number once it exists.
   - The "Betas:" paragraph gets one small fix in this PR: beta.1 is described
     as "everything below except 'Planned' and the entry-bounds change", and
     "Planned" no longer exists, so it becomes "everything below except the
     entry-bounds change and the documents removal". _(My call: the paragraph
     must not point at a deleted section; the Breaking line already says which
     betas had the module.)_ The beta.9 entry itself is added by the
     `chore: Release` commit that cuts beta.9, not by this PR (as with earlier
     betas).
8. **`DEFERRED.md`**: delete the "Move the documents module out of the public
   SDK" entry, per the file's rule that finished items leave it (the user,
   2026-11-11). "Before 5.0.0 final" then reads "None open."

## Checks

- `grep -rn -i documents` outside `.git/`, `.worktrees/` and `docs/superpowers/`
  finds only the README pointer, the CHANGELOG Breaking line and the `CLAUDE.md`
  rule's example.
- `deno check mod.ts`, `deno lint`, `deno fmt --check`.
- `deno publish --dry-run` (no upload) passes, so the `exports` map is valid.
- Tests on the local stack, skipping the account test (it writes the shared
  database and sends a text):
  `deno test --allow-net --allow-env --allow-read --env-file=.env --ignore=lib/account`.
  sdk-js has no test CI (only `publish.yml`, on tags), so the results go in the
  PR description.

## Merge order

The PR opens now and stays unmerged until (1) the dashboard's copy is merged
into data-dashboard `main`, (2) the coordinator has checked that PR's inventory
and says go, and (3) the user says yes to the merge. The PR description says so.
The coordinator (`data-dashboard-8a`, a running Claude session found with
ListAgents) gets the PR link by a direct session message (SendMessage) when it
opens, and again when it merges.

## Left to the builder

Commit split, the exact README and CHANGELOG wording within the points above,
and the PR description.
