/**
 * Utilities for reading a document's snapshots (kept 30 days).
 *
 * @example Usage
 * ```ts
 * import { getSnapshot, listSnapshots } from "@sjvair/sdk/documents/snapshots";
 *
 * const [newest] = await listSnapshots("abc");
 * const snapshot = await getSnapshot("abc", newest.id);
 * console.log(snapshot.version, snapshot.body);
 * ```
 *
 * @module
 */
import * as z from "zod";
import type { RequestOptions } from "$http";
import { ACCEPT_HEADERS, documentsCall, documentsPath } from "./call.ts";
import { snapshotMetaSchema, snapshotSchema } from "./schema.ts";
import type { Snapshot, SnapshotMeta } from "./types.ts";

/**
 * Lists a document's snapshots, newest first, without their bodies.
 *
 * @param id The document id.
 * @param options Request options.
 * @returns The snapshots
 */
export async function listSnapshots(
  id: string,
  options?: RequestOptions,
): Promise<Array<SnapshotMeta>> {
  return await documentsCall({
    url: documentsPath(id, "snapshots"),
    init: { headers: ACCEPT_HEADERS },
    options,
  }, z.array(snapshotMetaSchema));
}

/**
 * Gets one snapshot of a document, with its body.
 *
 * @param id The document id.
 * @param snapshotId The snapshot's id.
 * @param options Request options.
 * @returns The snapshot
 */
export async function getSnapshot(
  id: string,
  snapshotId: number,
  options?: RequestOptions,
): Promise<Snapshot> {
  return await documentsCall({
    url: documentsPath(id, "snapshots", snapshotId),
    init: { headers: ACCEPT_HEADERS },
    options,
  }, snapshotSchema);
}
