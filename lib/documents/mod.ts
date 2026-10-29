/**
 * Utilities for the SJVAir `/documents/` endpoints: the signed-in user's
 * saved dashboards, their change log, share links, snapshots, and public
 * display name.
 *
 * The calls rely on the session cookie (pass extra headers through
 * `options.init` outside a browser) and throw `DocumentRefusal` with the
 * server's refusal code when the server refuses one.
 *
 * @example Usage
 * ```ts
 * import { isDocumentRefusal, saveDocument } from "@sjvair/sdk/documents";
 *
 * try {
 *   const { version } = await saveDocument("abc", form);
 * } catch (error) {
 *   if (isDocumentRefusal(error, "stale_base")) {
 *     // Rebase on error.data.changes (or error.data.document) and save again.
 *   } else throw error;
 * }
 * ```
 *
 * @module
 */
export {
  deleteDocument,
  getDocument,
  getDocumentChanges,
  listDocuments,
  saveDocument,
} from "./documents.ts";
export {
  createShareLink,
  getDocumentCredit,
  getSharedDocument,
  getSharedDocumentChanges,
  revokeShareLink,
} from "./sharing.ts";
export { getSnapshot, listSnapshots } from "./snapshots.ts";
export { getDocumentProfile, updateDocumentProfile } from "./profile.ts";
export {
  DocumentRefusal,
  DocumentResponseError,
  isDocumentRefusal,
  REFUSAL_CODES,
  type RefusalCode,
} from "./refusal.ts";
export { staleBaseDataSchema } from "./schema.ts";
export * from "./types.ts";
