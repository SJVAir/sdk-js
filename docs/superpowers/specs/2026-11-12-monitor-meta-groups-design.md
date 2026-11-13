# Monitor meta groups and help text (SDK)

Date: 2026-11-12. The SDK side of sjvair.com #332 (merged into `develop`) and
its spec `docs/superpowers/specs/2026-11-12-monitor-meta-groups-design.md`, for
map-sdk part 5 (the shared map toolbar, data dashboard Release 1 step 5). Read
that spec for the server behaviour. This one covers only what `@sjvair/sdk`
adds.

## Why

The shared map toolbar groups monitor types under headings ("Reference-grade",
"Low-cost sensors") and shows a help line per pollutant. sjvair.com #332 serves
both in `GET /api/2.0/monitors/meta/`, so clients stop hardcoding monitor-map's
lists. map-sdk reads them through the SDK.

`getMonitorsMeta` does not run the Zod schema on the response, so the new fields
already arrive in the returned objects. But they're untyped, and
`monitor_groups` is unreachable: `MonitorsMeta` exposes data only through its
own getters. The same goes for `monitors[type].entries[entry].published`, which
the server has sent since September (sjvair.com `383a58e9`) and the SDK never
typed. This change types all four.

## Scope

On `release/5.0.0`, as **`5.0.0-beta.10`**. Per the no-fallbacks convention,
every new field is required; a beta needs a server running sjvair.com `develop`
with #332.

### Schemas (`lib/monitors/schemas/monitors_meta.ts`)

- New `monitorGroupSchema`: `{ key: string, label: string, order: number }`.
- `sjvairMonitorsMetaSchema` gains
  `monitor_groups:
  z.record(z.string(), monitorGroupSchema)`. Ids are
  permanent, labels may change, and clients sort by `order`.
- `sjvairMonitorDeviceMetaSchema` gains `group: z.string().nullable()`: a
  `monitor_groups` key, or `null` for a type with no grade.
- `sjvairEntryMetaSchema` gains `description: z.string().nullable()`: help text
  for the 8 air-quality pollutants, `null` for weather and `particulates`.
- `sjvairMonitorEntryMetaSchema` gains `published: z.boolean()`: whether this
  (monitor type, entry type) pair is shown by the map endpoints (`current/`,
  `at/`, `closest/`).

### Types (`lib/monitors/types.ts`)

- New exported `MonitorGroup = zinfer<typeof monitorGroupSchema>`.
- `SJVAirMonitorsMeta`, `SJVAirMonitorDeviceMeta`, `SJVAirEntryMeta` and
  `SJVAirMonitorEntryMeta` pick up the new fields through their schemas.

### Wrapper (`lib/monitors/get_monitors_meta.ts`)

- `MonitorsMeta.monitor_groups` getter: the record.
- `MonitorsMeta.asIter.monitor_groups`: `Array<MonitorGroup>`, sorted by
  `order`, so clients don't have to sort it themselves.
- `EntriesMeta.description` getter.
- Update the module's `@example` output.

### Fixture, tests, docs

- Refresh `lib/monitors/fixtures/monitors_meta.json` from the local server.
- Tests: the live response and fixture validate against the schema; every
  non-null `group` is a key in `monitor_groups`; `asIter.monitor_groups` is in
  `order`; pm25 has a description and temperature's is `null`; `published` is a
  boolean on every monitor entry.
- `CHANGELOG.md` line under `5.0.0-beta.10`. `api-urls.md` needs no change (same
  endpoint).

## Approaches

- **`group` as a plain string (chosen by the user)**: like the `monitors` and
  `entries` record keys. A new server group needs no SDK change.
- **`group` as `"reference" | "low-cost"`**: stricter, but a new group would
  break the type and need an SDK release. Rejected.

## Non-goals

- No helper that lists a group's monitor types; `asIter.monitors` filtered by
  `group` covers it.
- No getter for `published` on a wrapper: monitor entry meta isn't wrapped
  (`monitorType()` returns the plain object), so the schema field is enough.

## Left to the builder

Test placement and names, JSDoc wording.
