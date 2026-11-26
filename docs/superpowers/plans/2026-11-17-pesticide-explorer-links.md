# Pesticide explorer links: plan

Spec: `docs/superpowers/specs/2026-11-17-pesticide-explorer-links-design.md`.
Branch `feature/pesticide-explorer-links` from `release/5.0.0`, PR into it.

1. **Meta schema.** In `lib/pesticides/schemas/pesticides_meta.ts`, add the five
   links and `link_params` (`pesticideLinkSourceSchema` as an open enum). Export
   `PesticideLinkKey`, `PesticideLinkSource` and `PesticideLinkParam` from
   `types.ts`. Update the fixture and the meta tests (required fields, unknown
   `from`). Run `lib/pesticides/mod_test.ts`.
2. **Helper.** `lib/pesticides/pesticide_link_url.ts` with `pesticideLinkUrl`
   and `PesticideLinkValues`, a JSDoc `@example` and `@module`, exported from
   `mod.ts` and `deno.json` (`./pesticides/pesticide_link_url`). Tests first in
   `pesticide_link_url_test.ts`.
3. **Section-detail filters.** Extend `PesticideSectionDetailFilters`; a test
   that each new filter reaches the query; live test steps with the filters.
4. **Docs.** `getPesticidesMeta`'s JSDoc, `CHANGELOG.md` (beta.14),
   `api-urls.md` if its notes name the parameters.
5. **Verify.** `deno fmt`, `deno lint`, `deno check`, `deno publish --dry-run`,
   the pesticides tests (not the account test). Re-check against the server
   branch when it's pushed, recapture the meta fixture and run the live tests.
6. **PR** into `release/5.0.0`; tell the coordinator. Release beta.14 only after
   the user's yes.
