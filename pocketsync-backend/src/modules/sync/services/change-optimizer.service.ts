import { Injectable } from '@nestjs/common';
import { SyncChange, ChangeType, ChangeDataKey } from '../dto/sync-change-batch.dto';

/**
 * Service responsible for optimizing change sequences
 * Applies rules to collapse multiple changes into more efficient representations
 */
@Injectable()
export class ChangeOptimizerService {
  /**
   * Optimize a set of changes by collapsing sequential operations on the same record
   * 
   * Optimization Rules:
   * - Insert + Update → Insert: If a record was inserted and then updated, combine into a single insert with the final data
   * - Update + Update → Update: Multiple updates can be collapsed into a single update with the final state
   * - Insert + Delete → No Operation: If a record was inserted and then deleted, both operations can be dropped
   * - Update + Delete → Delete: If a record was updated and then deleted, only send the delete
   */
  optimizeChanges(changes: SyncChange[]): SyncChange[] {
    if (!changes || changes.length <= 1) {
      return changes;
    }

    // Sort changes by recordId, tableName, and timestamp to group related operations
    const sortedChanges = [...changes].sort((a, b) => {
      // First sort by recordId
      const recordCompare = a.recordId.localeCompare(b.recordId);
      if (recordCompare !== 0) return recordCompare;

      // Then by tableName
      const tableCompare = a.tableName.localeCompare(b.tableName);
      if (tableCompare !== 0) return tableCompare;

      // Finally by timestamp
      return a.timestamp - b.timestamp;
    });

    // Group changes by record identifier (tableName + recordId)
    const changesByRecord: Record<string, SyncChange[]> = {};

    for (const change of sortedChanges) {
      const key = `${change.tableName}:${change.recordId}`;
      if (!changesByRecord[key]) {
        changesByRecord[key] = [];
      }
      changesByRecord[key].push(change);
    }

    // Apply optimization rules to each group
    const optimizedChanges: SyncChange[] = [];

    for (const recordKey in changesByRecord) {
      const recordChanges = changesByRecord[recordKey];
      const optimizedRecordChanges = this.optimizeChangeSequence(recordChanges);
      optimizedChanges.push(...optimizedRecordChanges);
    }

    // Sort the final result by timestamp
    return optimizedChanges.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Optimize a sequence of changes for a single record
   */
  private optimizeChangeSequence(changes: SyncChange[]): SyncChange[] {
    if (changes.length <= 1) {
      return changes;
    }

    // Instead of iteratively applying rules, we'll optimize the entire sequence at once
    // to match the client-side implementation
    const optimizedChange = this.optimizeChangesForRecord(changes);

    return optimizedChange ? [optimizedChange] : [];
  }

  /**
   * Optimize a sequence of changes for a single record
   * This implementation matches the client-side logic
   */
  private optimizeChangesForRecord(changes: SyncChange[]): SyncChange | null {
    // If there are no changes, return null
    if (changes.length === 0) return null;

    // If there's only one change, return it directly
    if (changes.length === 1) return changes[0];

    // Get the first and last operations
    const firstChange = changes[0];
    const lastChange = changes[changes.length - 1];
    const firstOp = firstChange.operation;
    const lastOp = lastChange.operation;

    // Special case: If the record was inserted and then deleted, we can skip both operations
    if (firstOp === ChangeType.INSERT && lastOp === ChangeType.DELETE) {
      return null;
    }

    // Special case: If the record was deleted, only the delete matters
    if (lastOp === ChangeType.DELETE) {
      return lastChange;
    }

    // For INSERT followed by UPDATEs, we can combine them into a single INSERT
    if (firstOp === ChangeType.INSERT) {
      // Start with a copy of the first change
      const optimizedChange = { ...firstChange };

      // Update with the latest data from the last change
      if (lastChange.data.has(ChangeDataKey.NEW)) {
        // Create a new Map with only the 'new' data
        const newData = new Map<ChangeDataKey, any>();
        newData.set(ChangeDataKey.NEW, lastChange.data.get(ChangeDataKey.NEW));

        optimizedChange.data = newData;
        optimizedChange.version = lastChange.version;
        optimizedChange.timestamp = lastChange.timestamp;
      }

      return optimizedChange;
    }

    // For multiple UPDATEs, we can combine them into a single UPDATE
    if (firstOp === ChangeType.UPDATE && lastOp === ChangeType.UPDATE) {
      // Start with a copy of the first change
      const optimizedChange = { ...firstChange };

      // Create a new Map that combines the 'old' data from the first change
      // and the 'new' data from the last change
      const newData = new Map<ChangeDataKey, any>();

      if (firstChange.data.has(ChangeDataKey.OLD)) {
        newData.set(ChangeDataKey.OLD, firstChange.data.get(ChangeDataKey.OLD));
      }

      if (lastChange.data.has(ChangeDataKey.NEW)) {
        newData.set(ChangeDataKey.NEW, lastChange.data.get(ChangeDataKey.NEW));
      }

      optimizedChange.data = newData;
      optimizedChange.version = lastChange.version;
      optimizedChange.timestamp = lastChange.timestamp;

      return optimizedChange;
    }

    // Default: If we can't optimize, return the last change
    return lastChange;
  }
}
