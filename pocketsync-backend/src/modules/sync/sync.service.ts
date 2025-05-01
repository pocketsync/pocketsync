import { Injectable } from '@nestjs/common';
import { SyncChangeBatchDto } from './dto/sync-change-batch.dto';

@Injectable()
export class SyncService {
    async uploadChanges(changes: SyncChangeBatchDto) {
        // TODO
        return { success: true };
    }

    async downloadChanges(since: number) {
        // TODO
        return { changes: [] };
    }
}
