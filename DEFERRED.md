# Deferred work

The register of SDK work that has been decided or proposed but not done yet.
Each entry says why it was deferred and what triggers revisiting it. Items leave
this file only by being done or explicitly dropped by the user (moved to
"Dropped", with a reason).

## Before 5.0.0 final

None open.

## Breaking changes (next major version)

None open. (Exact entry bounds by default shipped in 5.0.0-beta.2; see
`docs/superpowers/specs/2026-11-04-exact-entry-bounds-design.md`.)

## Not wrapped yet

- **`pesticides/notices/archive/`.** _Deferred 2026-11-16 by the user (pesticide
  map spec, `docs/superpowers/specs/2026-11-16-pesticide-map-design.md`)._ The
  server serves archived spray notices (past the grace period, by `year`,
  `month` or `date`, with the same features as `notices/active/`), but nothing
  calls it yet. Wrapping it now would guess at a caller's needs.

  **Revisit when** an app needs past spray notices (e.g. a map or chart of
  notices older than the active window).

## Small follow-ups

Minor findings from reviews, left for later. Each is small and safe to pick up
any time.

- **Small follow-ups from the pesticide map reviews.** _Deferred 2026-11-16
  (final reviews of sdk-js #65 and #66, graded minor)._
  - `CHANGELOG.md`'s Added entry for `getActivePesticideNotices` doesn't list
    every new type (`DatedPesticideNoticeCollection`, the notice property
    types).
  - `regions/meta/`'s `location_types` is typed with the three known keys
    required, while the schema accepts a meta that lacks one (the user chose to
    keep it, 2026-11-16).
  - `getPesticideSections`' `compare` doc doesn't say the `*_prev` fields are
    absent when `compare` equals the year or with `year: "all"`.
  - No township fixture carries an outline (the captured one uses `geometry=0`),
    so the township geometry is never schema-checked.
  - The meta test asserts the exact ramp (8 colors, `#f0f0f0`), which the server
    calls provisional; its `shades_valley` check sits in the ramp step.
  - `pesticideSectionDetailSchema` writes the year union inline instead of
    reusing `PesticideMapYearSchema`.

  **Revisit when** someone next works on the pesticide map wrappers, or the
  server's ramp or township geometry changes.

- **Small follow-ups from the SDK quick batch review.** _Deferred 2026-11-04
  (final review of sdk-js #40, graded minor)._
  - No test aborts a batched lookup after some chunks have already answered (the
    current abort tests abort before any chunk settles). The behavior is right
    (the reviewer checked it with a scratch test); nothing guards it.
  - `getRegionsGeoJSON` with `external_id` as one comma-joined string of more
    than 100 codes is still one request, which the server refuses with a 400.
    Split the string and batch it like an array, or document the string form as
    one code.
  - With `version` typed as the whole `CESVersion` union (e.g. from a select),
    `getCalEnviroScreen`'s query accepts `year` for 5.0 and the result is a
    union of both shapes. Overloads or a JSDoc note would tighten it.
  - `getCalEnviroScreenTract` puts the tract code in the URL path unencoded.
    Census codes are digits, so it's safe today; `encodeURIComponent` would make
    it safe for user input.

  **Revisit when** someone next works on the regions batching or the
  CalEnviroScreen module, or a caller hits one of these.

- **Every county on multi-county place search rows.** _Deferred 2026-11-04 by
  the user (sjvair.com #308 keeps one `county` per `regions/places/search/`
  row)._ A region that straddles counties names only one. When the server adds a
  `counties` list, `regionPlaceMatchSchema` and `RegionPlaceMatch` follow.
  Tracked in data-dashboard DEFERRED.md under the same title.

  **Revisit when** sjvair.com adds `counties` to place search rows.

- **Tests that run in CI.** _Raised 2026-11-07 by the user._ Most tests need a
  locally running sjvair.com, and the account test also needs a real phone and a
  code typed at a prompt, so sdk-js has no PR CI (only the tag publish workflow)
  and every check is a local run. Redo them so CI can run them without a server
  or user input: stubbed fetch with captured fixtures (the pattern
  `lib/http/fetch_stub_test_utils.ts` and the pesticides, regions and meta tests
  already use), keeping live-server steps as an opt-in layer. Deferred because
  it touches every module's tests and isn't blocking the dashboard work.

  **Revisit when** the dashboard launch is out (after the sjvair.com production
  deploy; retargeted from 5.0.0 final by the user, 2026-11-25), or the next time
  a test hits a shared stack by mistake or a change ships without a local run.

## Dropped

None yet.
