# Region display names: `name_template` and `regionDisplayName`

SDK half of sjvair.com `docs/superpowers/specs/2026-11-05-region-name-templates-design.md`
(the why, the decisions and the server contract live there). Drafted 2026-11-05.

## The server contract, in short

Each `regions/meta/` `types.<type>` entry gains `name_template`: a string holding the literal
`{name}` exactly once, or `null` when the type shows its plain `name`. Today: `zipcode`
`"ZIP {name}"`, `tract` `"Census Tract {name}"`, `urban_area` `"{name} Urban Area"`, `ab617`
`"{name} AB 617 Community"`; every other type `null`. Region rows don't change.

## Why the SDK needs a change

The SDK's zod objects drop unknown keys, so the dashboard can't see `name_template` until
`regionTypeMetaSchema` has it. A helper keeps every client filling the template the same way,
so no client writes its own string handling for it.

## Changes

- **Schema:** `regionTypeMetaSchema` (`lib/regions/schemas/regions_meta.ts`) gains
  `name_template: z.nullable(z.string())`, documented like its neighbours ("The pattern for
  showing a region of this type, with `{name}` standing for the region's name; `null` shows the
  name as it is"). `RegionTypeMeta` picks it up through `types.ts`. Required, not optional: the
  SDK keeps no fallbacks for older servers (it goes live with sjvair.com `develop`).
- **Helper:** a new file `lib/regions/region_display_name.ts`, re-exported from
  `lib/regions/mod.ts` and added to `deno.json` `exports` as
  `./regions/region_display_name`:

  ```ts
  export function regionDisplayName(
    region: { type: RegionType; name: string },
    meta: Pick<RegionsMetaData, "types">,
  ): string;
  ```

  It returns `meta.types[region.type].name_template` with `{name}` replaced by `region.name`,
  or `region.name` when the template is `null` or the type is missing from `meta`. It
  replaces only the literal `{name}` and must not interpret anything in the name (use
  `split`/`join` or a replacer function, not a replacement string, so a `$` in a name stays
  literal). `meta` takes either the `RegionsMeta` instance from `getRegionsMeta()` or its
  plain data. Every region shape the SDK returns (list items, details, search and lookup
  rows, GeoJSON feature properties, `regionRefSchema`, location rows' region refs) has
  `type` and `name`, so all of them can be passed directly.
- **Tests:** a network-free `lib/regions/region_display_name_test.ts` covering a filled
  template, a `null` template, a type missing from `meta`, and a name holding `$&` and `{name}`.
  The existing `regions/meta` integration test checks `name_template` is present on every type,
  a string or `null`, and `"ZIP {name}"` for `zipcode`.
- **`CHANGELOG.md`:** under 5.0.0's betas, an "Added" line for `name_template` and
  `regionDisplayName`, and the beta line once it's published.
- Update `getRegionsMeta`'s doc example only if it lists type keys (it currently shows
  `type`, `label`, `category`; leave it unless the PR touches it anyway).

## Release

Branch `feature/region-name-templates` from `origin/release/5.0.0`, PR into it. The beta
(likely `5.0.0-beta.4`, also shipping the merged #48) needs the user's explicit yes before any
tag or publish. After publishing, send the version to the coordinator (data-dashboard-b7),
who has data-dashboard-13 pin it.

## Non-goals

- A display name on region rows, or a method on each row.
- Formatting tract numbers or adding counties (deferred; see the sjvair.com spec).
- Translating templates.
