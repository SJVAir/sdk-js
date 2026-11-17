# Pesticide explorer links and section-detail filters

2026-11-17. SDK side of data-dashboard Release 1, step 5, spec 5b: the Map's
section card links to the Pesticides Explorer, and its months and top chemicals
follow the Map's filters. Ships as `5.0.0-beta.14`.

Server spec: sjvair.com
`docs/superpowers/specs/2026-11-17-pesticide-explorer-links-design.md` (branch
`feature/pesticide-explorer-links`, e57a4df2). It is the source of truth for
every shape below. Where this document and the server spec disagree, the server
spec wins.

## Goals

1. `getPesticidesMeta`'s `links` gains `section_page`, `section_records`,
   `section_notices`, `section_notices_past` and `chemical_page`: absolute URL
   templates with `{id}` (a section or chemical id), under `/tools/pesticides/`.
2. A new required `link_params` on meta, keyed like those five links: a list of
   `{ param, from }` per link.
3. `pesticideLinkUrl`, a helper that fills one template by the server's fill
   rule, so no client re-implements it.
4. `getPesticideSectionDetails` takes `chemical_id`, `product_id`,
   `commodity_id`, `category`, `iarc_group`, `aerial_ground` and `month`.

## Non-goals

- Choosing between `section_notices` and `section_notices_past`, or working out
  a month's first and last day. Both are the caller's: the server spec gives the
  rule for each, and the helper takes the values as given.
- Any change to the section-detail response shape. `month` narrows only the top
  lists; `months` stays twelve rows.
- `notes.shades_valley` is reworded on the server. Notes are a record of
  strings, so nothing changes here.

## Design

### Schema

- `links`: the five new keys are required strings, next to `spraydays_signup`.
- `link_params`: an object with the same five keys, each an array of
  `{ param: string, from: PesticideLinkSource }`. `from` is an open enum
  (`openEnum`) of `year`, `month_start`, `month_end`, `chemical_id`,
  `product_id`, `commodity_id`, `aerial_ground`, `narrow`, `notices_year` and
  `notices_month`. A newer value still parses, and the helper skips it unless
  the caller passes it.
- Both are required (CLAUDE.md: no fallbacks). The server's day-long meta cache
  can serve the old shape for a day after the deploy; the release goes live with
  the server, as usual.

### `pesticideLinkUrl(meta, link, id, values?)`

```ts
pesticideLinkUrl(meta, "section_records", section.id, {
  year: 2023,
  month_start: "2023-06-01",
  month_end: "2023-06-30",
  chemical_id: "k3x9a",
});
// https://www.sjvair.com/tools/pesticides/records/?section=…&year=2023&start=2023-06-01&end=2023-06-30&chemical=k3x9a
```

- `meta` is `Pick<PesticidesMeta, "links" | "link_params">`; `link` is one of
  the five keys (`PesticideLinkKey`).
- The fill rule, from the server spec: replace `{id}` (URL-encoded), then for
  each `link_params[link]` entry, in order, whose `from` value the caller has,
  append `param=value` URL-encoded, joined by `&`, or `?` when the template has
  no query yet. A value the caller has is anything but `undefined`, `null` or
  `""` (the server treats an empty parameter as unset). Numbers are stringified.
- Pure: no fetch, no validation.

### Section-detail filters

`PesticideSectionDetailFilters` gains the seven parameters, typed like the
`sections/` filters (`AerialGroundFilter`, `IARCGroup`, a category string or
list sent as repeated params). `month` (1–12) is documented as narrowing only
the top lists. Bad values are the server's 400 `{ "error": … }`.

## Testing

- Fixture: `pesticides_meta.json` recaptured from the local stack once the
  server branch runs there; until then, the new keys are added by hand from the
  server spec, and the PR says which.
- Unit: the schema accepts the fixture and rejects meta without `link_params` or
  without a new link; an unknown `from` parses; the helper fills `{id}`, appends
  in order, uses `?` for a template without a query, encodes values, skips
  missing and empty values and unknown sources.
- Unit: every new section-detail filter reaches the query string.
- Live: meta validates; a section-detail request with each filter validates and
  keeps twelve `months`.
