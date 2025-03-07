import { Injectable, Logger } from '@nestjs/common';
import { ChangeLog } from '@prisma/client';

@Injectable()
export class MetadataSanitizerService {
    private readonly logger = new Logger(MetadataSanitizerService.name);

    /**
     * Ensures that timestamps and versions are only at the row level, not in row.data
     * This prevents SQLite errors on mobile clients
     */
    ensureMetadataAtRowLevel(changeLog: ChangeLog): ChangeLog {
        try {
            // Deep clone to avoid modifying the original
            const sanitizedChangeLog = { ...changeLog };
            
            // Handle different types of changeSet (could be string or already parsed JSON)
            let changeSetObj: any;
            
            if (typeof sanitizedChangeLog.changeSet === 'string') {
                changeSetObj = JSON.parse(sanitizedChangeLog.changeSet);
            } else if (sanitizedChangeLog.changeSet && typeof sanitizedChangeLog.changeSet === 'object') {
                // Already an object, just clone it
                changeSetObj = JSON.parse(JSON.stringify(sanitizedChangeLog.changeSet));
            } else {
                // Invalid format, return original
                return changeLog;
            }
            
            // Process each operation type (insertions, updates, deletions)
            for (const operation of ['insertions', 'updates', 'deletions']) {
                if (!changeSetObj[operation]) continue;
                
                // Process each table in the operation
                for (const tableName in changeSetObj[operation]) {
                    const tableChanges = changeSetObj[operation][tableName];
                    if (!tableChanges || !tableChanges.rows || !Array.isArray(tableChanges.rows)) continue;
                    
                    // Ensure metadata is only at row level, never in row.data
                    for (const row of tableChanges.rows) {
                        if (!row) continue;
                        
                        // Remove timestamp and version from data if present
                        if (row.data && typeof row.data === 'object') {
                            delete row.data.timestamp;
                            delete row.data.version;
                        }
                    }
                }
            }
            
            // Update the changeSet with our sanitized version
            sanitizedChangeLog.changeSet = JSON.stringify(changeSetObj);
            
            return sanitizedChangeLog;
        } catch (error) {
            this.logger.error(`Error processing change data: ${error.message}`, error.stack);
            return changeLog; // Return original if something goes wrong
        }
    }
}
