# Deferred work

The register of SDK work that has been decided or proposed but not done yet.
Each entry says why it was deferred and what triggers revisiting it. Items leave
this file only by being done or explicitly dropped by the user (moved to
"Dropped", with a reason).

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
