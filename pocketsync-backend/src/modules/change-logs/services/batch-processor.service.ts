import { Injectable } from '@nestjs/common';
import { ChangeSetDto } from '../dto/change-set.dto';

@Injectable()
export class BatchProcessorService {
  private readonly MAX_CHANGES_PER_BATCH = 1000;
  private readonly MAX_BATCH_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  splitIntoBatches(changeSets: ChangeSetDto[]): ChangeSetDto[][] {
    const batches: ChangeSetDto[][] = [];
    let currentBatch: ChangeSetDto[] = [];
    let currentBatchSize = 0;
    let currentChangeCount = 0;

    for (const changeSet of changeSets) {
      const changeSetSize = this.estimateChangeSetSize(changeSet);
      const changeCount = this.countChanges(changeSet);

      if (currentBatch.length > 0 &&
        (currentBatchSize + changeSetSize > this.MAX_BATCH_SIZE_BYTES ||
          currentChangeCount + changeCount > this.MAX_CHANGES_PER_BATCH)) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchSize = 0;
        currentChangeCount = 0;
      }

      currentBatch.push(changeSet);
      currentBatchSize += changeSetSize;
      currentChangeCount += changeCount;
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private estimateChangeSetSize(changeSet: ChangeSetDto): number {
    return Buffer.byteLength(JSON.stringify(changeSet));
  }

  private countChanges(changeSet: ChangeSetDto): number {
    let count = 0;
    for (const changeType of ['insertions', 'updates', 'deletions'] as const) {
      for (const tableChanges of Object.values(changeSet[changeType])) {
        count += tableChanges.rows.length;
      }
    }
    return count;
  }
}