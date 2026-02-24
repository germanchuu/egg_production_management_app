/**
 * ConflictResolver Service
 *
 * Implements Last-Write-Wins (LWW) conflict resolution strategy.
 *
 * Used when the SAME record (same ID) is modified on two different devices
 * while offline, then both sync to the server. Compares updatedAt timestamps
 * and keeps the most recent version.
 *
 * NOTE: This only applies to UPDATE and DELETE operations on existing records.
 * CREATE operations with different UUIDs never conflict.
 *
 * Usage:
 * ```typescript
 * import { ConflictResolver } from '@/shared/sync/ConflictResolver';
 *
 * const resolver = new ConflictResolver();
 *
 * const result = resolver.resolve(localDocument, remoteDocument);
 * if (result.winner === 'local') {
 *   // Re-upload local version to server
 * } else {
 *   // Apply remote version to local database
 * }
 * ```
 */

/**
 * Document with updatedAt timestamp (all synced entities)
 */
export interface TimestampedDocument {
  updatedAt: string; // ISO-8601 timestamp
  [key: string]: any; // Other fields
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution<T extends TimestampedDocument> {
  winner: 'local' | 'remote';
  document: T;
}

/**
 * Conflict pair for batch resolution
 */
export interface ConflictPair<T extends TimestampedDocument> {
  local: T;
  remote: T;
}

/**
 * ConflictResolver implementing Last-Write-Wins (LWW) strategy
 */
export class ConflictResolver {
  /**
   * Resolves a conflict between local and remote versions of the same document
   *
   * Strategy: Last-Write-Wins (LWW)
   * - Compares updatedAt timestamps
   * - The document with the newer timestamp wins
   * - If timestamps are equal, remote wins (tie-breaker)
   *
   * @param local Local version of the document
   * @param remote Remote version of the document
   * @returns Resolution result with winner and document
   * @throws Error if documents are missing updatedAt or have invalid timestamps
   */
  resolve<T extends TimestampedDocument>(
    local: T,
    remote: T
  ): ConflictResolution<T> {
    // Validate both documents have updatedAt
    if (!local.updatedAt || !remote.updatedAt) {
      throw new Error('Both documents must have updatedAt timestamps');
    }

    // Parse timestamps
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    // Validate timestamps are valid
    if (isNaN(localTime) || isNaN(remoteTime)) {
      throw new Error('Invalid timestamp format');
    }

    // Last-Write-Wins: Compare timestamps
    if (localTime > remoteTime) {
      return {
        winner: 'local',
        document: local,
      };
    } else {
      // Remote wins if newer OR equal (tie-breaker)
      return {
        winner: 'remote',
        document: remote,
      };
    }
  }

  /**
   * Resolves multiple conflicts in batch
   *
   * @param conflicts Array of conflict pairs (local + remote)
   * @returns Array of resolution results
   * @throws Error on first validation failure (stops processing)
   */
  batchResolve<T extends TimestampedDocument>(
    conflicts: ConflictPair<T>[]
  ): ConflictResolution<T>[] {
    return conflicts.map((conflict) =>
      this.resolve(conflict.local, conflict.remote)
    );
  }
}
