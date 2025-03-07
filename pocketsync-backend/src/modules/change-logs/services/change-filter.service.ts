import { Injectable, Logger } from '@nestjs/common';
import { ChangeLog } from '@prisma/client';

@Injectable()
export class ChangeFilterService {
    private readonly logger = new Logger(ChangeFilterService.name);

    /**
     * Filters out records that have been deleted from the changes
     * This is especially important for new or reinstalled devices
     */
    filterDeletedRecords(changes: ChangeLog[]): ChangeLog[] {
        if (!changes || changes.length === 0) {
            return changes;
        }

        this.logger.log(`Filtering out deleted records from ${changes.length} changes`);
        
        // Create a copy of the changes array
        const filteredChanges = [...changes];
        
        // Track deleted records to filter them out
        const deletedRecords = new Map<string, Set<string>>(); // tableName -> Set of primaryKeys
        
        // First pass: identify all deleted records
        for (const change of changes) {
            try {
                // Ensure changeSet is treated as a string before parsing
                const changeSetStr = typeof change.changeSet === 'string' 
                    ? change.changeSet 
                    : JSON.stringify(change.changeSet);
                
                const changeSet = JSON.parse(changeSetStr);
                
                // Skip if no deletions in this change
                if (!changeSet.deletions) continue;
                
                // Process each table with deletions
                Object.entries(changeSet.deletions).forEach(([tableName, tableChangesRaw]) => {
                    if (!deletedRecords.has(tableName)) {
                        deletedRecords.set(tableName, new Set());
                    }
                    
                    // Add each deleted primary key to our tracking set
                    const tableChanges = tableChangesRaw as any;
                    if (tableChanges && tableChanges.rows && Array.isArray(tableChanges.rows)) {
                        tableChanges.rows.forEach((row: any) => {
                            if (row && row.primaryKey) {
                                deletedRecords.get(tableName)?.add(row.primaryKey);
                            }
                        });
                    }
                });
            } catch (error) {
                this.logger.error(`Error processing change for deletions: ${error.message}`);
            }
        }
        
        // If we found deleted records, filter them out from the changes
        if ([...deletedRecords.keys()].length > 0) {
            let filteredCount = 0;
            
            // Process each change to filter out deleted records
            for (let i = 0; i < filteredChanges.length; i++) {
                try {
                    const change = filteredChanges[i];
                    // Ensure changeSet is treated as a string before parsing
                    const changeSetStr = typeof change.changeSet === 'string' 
                        ? change.changeSet 
                        : JSON.stringify(change.changeSet);
                        
                    const changeSet = JSON.parse(changeSetStr);
                    let modified = false;
                    
                    // Process insertions and updates to remove deleted records
                    ['insertions', 'updates', 'deletions'].forEach(operation => {
                        if (!changeSet[operation]) return;
                        
                        Object.entries(changeSet[operation]).forEach(([tableName, tableChangesRaw]) => {
                            const tableChanges = tableChangesRaw as any;
                            if (!tableChanges || !tableChanges.rows || !Array.isArray(tableChanges.rows)) return;
                            
                            // If this table has deleted records
                            if (deletedRecords.has(tableName)) {
                                const originalLength = tableChanges.rows.length;
                                
                                // Filter out rows that were eventually deleted
                                tableChanges.rows = tableChanges.rows.filter((row: any) => 
                                    row && row.primaryKey && !deletedRecords.get(tableName)?.has(row.primaryKey)
                                );
                                
                                // Track how many rows were filtered
                                filteredCount += (originalLength - tableChanges.rows.length);
                                
                                // If we removed any rows, mark as modified
                                if (originalLength !== tableChanges.rows.length) {
                                    modified = true;
                                }
                                
                                // If all rows were filtered out, remove the table entry
                                if (tableChanges.rows.length === 0) {
                                    delete changeSet[operation][tableName];
                                    modified = true;
                                }
                            }
                        });
                        
                        // If no tables left in this operation, remove the operation
                        if (Object.keys(changeSet[operation]).length === 0) {
                            delete changeSet[operation];
                            modified = true;
                        }
                    });
                    
                    // Update the change object if we modified it
                    if (modified) {
                        // Check if the change still has any operations
                        const hasOperations = ['insertions', 'updates', 'deletions'].some(op => 
                            changeSet[op] && Object.keys(changeSet[op]).length > 0
                        );
                        
                        if (hasOperations) {
                            // Update the change with filtered data
                            filteredChanges[i] = {
                                ...change,
                                changeSet: JSON.stringify(changeSet)
                            };
                        } else {
                            // Mark for removal if no operations left
                            filteredChanges[i] = null as any;
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error filtering change: ${error.message}`);
                }
            }
            
            // Remove any null entries (completely filtered changes)
            const finalChanges = filteredChanges.filter(change => change !== null);
            const removedChanges = filteredChanges.length - finalChanges.length;
            
            this.logger.log(`Filtered out ${filteredCount} deleted records across ${removedChanges} changes`);
            
            return finalChanges;
        }
        
        return filteredChanges;
    }
}
