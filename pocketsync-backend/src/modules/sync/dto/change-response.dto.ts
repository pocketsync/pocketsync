import { SyncChange } from "./sync-change-batch.dto";

export class ChangeResponseDto {
    changes: SyncChange[];
    timestamp: number;
    count: number;
    sync_session_id: string;
}