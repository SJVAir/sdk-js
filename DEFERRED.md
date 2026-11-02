# Deferred work

The register of SDK work that has been decided or proposed but not done yet.
Each entry says why it was deferred and what triggers revisiting it. Items leave
this file only by being done or explicitly dropped by the user (moved to
"Dropped", with a reason).

## Before 4.8.0 final

- **Move the documents module out of the public SDK.** _Decided 2026-11-02 by
  the user: it must happen before the data dashboard goes live._
  `@sjvair/sdk/documents` wraps the private `/documents/` endpoints (session
  cookie, signed-in users' dashboards), and the data dashboard is its only
  caller. The rest of the SDK is public air data. The plan: move the documents
  module (and any later private endpoints) into an internal package built on the
  public SDK's exports (`httpRequest`, `setOrigin`, request defaults), or into
  the dashboard repo itself while it stays the only caller. Where it goes is
  still open. The data dashboard's `DEFERRED.md` tracks the same item.

  Kept for now so the dashboard isn't blocked: the module has shipped only in
  prereleases (4.8.0-beta.2, and `createSnapshot` in beta.3), and `latest` is
  still 4.7.0, so removing it before 4.8.0 final breaks no stable release. Once
  4.8.0 final ships with it, removing it waits for 5.0.

  Things to settle when doing it:
  - a separate JSR package is still public; to keep it out of view, it has to
    live in the dashboard repo or stay unpublished;
  - a second package only pays off once a second app needs these endpoints;
  - the dashboard's pin and imports (`@sjvair/sdk/documents`) move with it.

  **Revisit when** 4.8.0 final is being prepared (before its tag), or the data
  dashboard's go-live is being planned, whichever comes first.

## Breaking changes (next major version)

- **Exact entry bounds by default; whole Pacific days as an opt-in.** _Deferred
  2026-10-25 (decided by the user)._ Today `getMonitorEntries` and
  `getMonitorEntriesCSVUrl` widen two bounds that are within 5 minutes of each
  other to whole Pacific days, unless the caller passes `exact: true` (added in
  4.8.0-beta.1 so existing callers keep their behavior). The user wants the
  default swapped:
  - bounds a caller gives are sent unchanged by default, and
  - a new opt-in flag rounds them to whole Pacific days (name to be decided,
    e.g. `wholeDays: true`), replacing `exact`.

  Unchanged by this: missing bounds still default to Pacific days.

  This changes behavior for existing callers, so it waits for a major version
  (5.0). Before releasing it:
  - audit every caller of `getMonitorEntries` and `getMonitorEntriesCSVUrl` in
    monitor-map, the mobile app, and the data dashboard;
  - add the day-rounding flag wherever one relies on today's widening;
  - drop `exact: true` from the data dashboard, which passes it today.

  **Revisit when** the next major sdk-js version is planned, or sooner if
  another caller is surprised by the widening.

## Dropped

None yet.
