# Remove `levels`, add `school_guidelines` (monitors meta)

## Intent

sjvair.com spec 5 ("Hardcoded values cleanup", sjvair.com
`docs/superpowers/specs/2026-11-04-hardcoded-values-cleanup-design.md`, branch
`feature/hardcoded-cleanup`) changes `monitors/meta/`:

- it removes the legacy `levels` dict from every `entries.<type>`; `scale`
  replaces it and stays as it is;
- it adds `school_guidelines` to every `entries.<type>`, `null` except for
  `pm25`;
- it changes what the forecast `color` and `aqi_category` values mean.

The SDK follows, so its types match what the server sends. This is SDK work for
the data dashboard (data-dashboard TODO.md item 8). The dashboard's "Can we go
outside?" card reads `school_guidelines` through the SDK.

## Decisions (the user's)

1. Remove `levels` from the SDK for 5.0: the schema field, the getter,
   `asIter.levels` and the fixtures.
2. Also remove `SJVAirEntryLevel`, `sjvairEntryLevelMetaSchema` and
   `EntriesMeta.asIter`, since nothing else uses them (checked 2026-11-04).
   `MonitorsMeta.asIter` and `RegionsMeta.asIter` are separate and stay.
3. Ships in the next beta, **5.0.0-beta.3**, paired with the server change.

## Goals

### 1. Remove `levels`

In `lib/monitors/schemas/monitors_meta.ts`, `lib/monitors/types.ts` and
`lib/monitors/get_monitors_meta.ts`:

- Delete `levels` from `sjvairEntryMetaSchema` and its interface.
- Delete `sjvairEntryLevelMetaSchema`, its interface, and the `SJVAirEntryLevel`
  type.
- Delete `EntriesMeta.levels` and `EntriesMeta.asIter` (its only member was
  `levels`).
- Update the `getMonitorsMeta` module example: no `levels` block. Show `scale`
  and `school_guidelines` instead, trimmed like the rest of the example.

### 2. Add `school_guidelines`

A new required, nullable field on `sjvairEntryMetaSchema`:
`school_guidelines: schoolGuidelinesSchema.nullable()`. The server always sends
the key, so it is not optional (sdk-js CLAUDE.md, "No fallbacks").

The shape, from spec 5:

```ts
{
  label: string; // "Outdoor Activity Guidelines for Schools"
  resolution: Resolution; // "hour"
  source: {
    name: string;
    url: string;
  }
  activities: Array<{
    key: "recess" | "pe" | "athletics" | "events";
    label: string; // "Recess"
    duration: string | null; // "15 minutes"; null for events
    levels: Record<string, string[]>; // PM2.5 scale level key → paragraphs
  }>;
}
```

- **Schemas** live in `lib/monitors/schemas/monitors_meta.ts`, next to the entry
  meta schema, as `schoolGuidelinesSchema` and `schoolActivitySchema`, each with
  an explicit interface like the others.
- **Types** in `lib/monitors/types.ts`: `SchoolGuidelines` and `SchoolActivity`,
  inferred with `zinfer`.
- **`key`** is a closed enum of the four keys, as the coordinator's shape says.
  Spec 5 makes these keys permanent.
- **`levels`** is keyed by the PM2.5 scale's level keys (all six present), so it
  is `Record<string, string[]>`. Values are plain strings: no HTML or Markdown.
- **`resolution`** reuses `resolutionSchema` from
  `lib/meta/schemas/dataset_catalog.ts`; spec 5 says it uses the catalog's
  vocabulary.
- **`source`** reuses `scaleSourceSchema` from `lib/meta/schemas/scale.ts` (same
  `{ name, url }` shape).
- **Accessor:** `EntriesMeta.school_guidelines`, a getter next to `scale`
  returning `SchoolGuidelines | null`, with JSDoc that it is set only for PM2.5
  and applies to hourly values.

### 3. Forecast docs

`color` and `aqi_category` stay `z.string()`. Only their JSDoc in
`lib/forecasts/schemas/forecast.ts` changes:

- `color`: the AQI scale level's color for `aqi_value`, a hex string.
- `aqi_category`: the AQI scale level's label for `aqi_value`.

The `get_forecasts.ts` example output is checked and corrected if it shows a
value the server no longer sends (such as "Out of Range" or a blended color).

### 4. Other docs

- `mod.ts` example: find the subscription's level in
  `meta.entryType("pm25").scale?.levels` by `key`, not in `asIter.levels` by
  `name`.
- `lib/account/air-alerts.ts` comment: `level` is a key into the `entry_type`'s
  `scale.levels` in `monitors/meta/`.
- `CHANGELOG.md` under 5.0.0:
  - Breaking: `levels`, `SJVAirEntryLevel`, `sjvairEntryLevelMetaSchema` and
    `EntriesMeta.asIter` are removed; use `scale`.
  - Added: `school_guidelines` and the `SchoolGuidelines` / `SchoolActivity`
    types.
  - Changed: forecast `color` and `aqi_category` now come from the AQI scale.
  - The betas line gets beta.3 when it is cut.

### 5. Fixtures and tests

- `lib/monitors/fixtures/monitors_meta.json`: remove every `levels` key and add
  `school_guidelines` to every entry type (`null` except `pm25`). The pm25 block
  is a real response from the server branch when one is running; otherwise it is
  transcribed word for word from sjvair.com
  `camp/templates/pages/guidelines/schools.html`.
- Stubbed-fetch tests (in the existing "Monitors meta scales" test or next to
  it):
  - `entryType("pm25").school_guidelines` has the four activities in order, and
    each activity's `levels` keys equal the pm25 scale's level keys;
  - `entryType("o3").school_guidelines` is `null`;
  - the fixture validates against `sjvairMonitorsMetaSchema`.
- The live `GET monitors/meta` step validates against the new schema. It fails
  against a server without spec 5 (`school_guidelines` missing). That is
  expected: a beta needs the matching server (sdk-js CLAUDE.md). Don't add a
  skip for it. Say so in the PR.

## Non-goals

- Any change to `scale`, `MonitorsMeta.asIter`, or other `monitors/meta/`
  fields.
- An `aqi_level` key on forecasts, or a typed key for forecast `color`.
- Helpers that look up a value's level or guidance (clients use `scale`).
- Updating callers. monitor-map, mobile and map-sdk update when they move to
  this beta (see "Callers").

## Constraints

- Branch `feature/remove-levels` from `origin/release/5.0.0`, worktree
  `.worktrees/remove-levels`, PR into `release/5.0.0`. Never merge without the
  user's yes.
- No `v*` tag, publish or beta without the user's yes for that release.
- No AI attribution in commits, PRs or docs.
- Never run lib/account tests (they send a real SMS).
- `deno check`, `deno lint`, `deno fmt --check` and the stubbed tests pass.

## Callers (read-only audit, 2026-11-04)

These break when they move to beta.3, and must switch to `scale` (level `name`
equals scale `key`):

- **monitor-map:** `asIter.levels` and `SJVAirEntryLevel` in tooltips, the
  cluster tooltip and renderer, the icon manager, the legend, DataChart colors,
  MonitorDetailPanel, MonitorSubscriptionManager and `monitors.svelte.ts`.
- **mobile:** MonitorSubscription.svelte, Subscriptions.svelte, Alerts.svelte
  and `alert-level.ts`.
- **map-sdk:** `src/lib/data/metadata.ts` builds `scaleFromLegacyLevels` from
  `entry.levels`. It stops type-checking and must be deleted.
- **data-dashboard:** the e2e fixture `e2e/fixtures/api/2.0/monitors/meta.json`
  still has `levels`.

Some scales lack keys: O3 has no `moderate`, PM2.5 and SO2 have no
`very_hazardous`, and SO2 has no `hazardous`. A subscription lookup needs a
not-found path.

## Release

beta.3 is cut from `release/5.0.0` after the server PR merges into sjvair.com
`develop`, and only with the user's yes. Until then the PR can be tested against
the server branch.

## Coordination

- Tell the coordinator (data-dashboard-2c) and sjvair-com-c9 when the PR opens,
  and send the callers list above.
- data-dashboard TODO.md item 8: update its status (own docs worktree).

## My calls (not the user's)

- `key` is a closed enum; `resolution` and `source` reuse the existing
  `resolutionSchema` and `scaleSourceSchema`.
- The forecast fixtures (`lib/forecasts/fixtures/forecasts_list.json`,
  `forecast_for_place.json`) swap their blended colors for the AQI scale's
  discrete colors, so they match what the server now sends. No test reads
  `color`.
- The fixture's `source.url` is `https://www.sjvair.com/guidelines/schools/`
  (the server builds it from the request).
- Until beta.3 is cut, the CHANGELOG betas line says this change is not in a
  beta yet, as was done for the entry-bounds change.

## Left to the builder

- Wording of JSDoc and the CHANGELOG lines.
- How the module example is trimmed.
- Whether the new stubbed steps join the existing meta test or get their own.
