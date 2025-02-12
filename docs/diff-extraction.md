# Change Tracking and Synchronization

1. Database Initialization:
When the sync engine starts, it sets up the following system tables:
- `__deltasync_changes`: Records all database modifications
- `__deltasync_version`: Tracks version numbers for each table
- `__deltasync_device_state`: Stores device-specific sync information
- `__deltasync_processed_changes`: Tracks which changes have been processed

2. Change Detection:
The system uses SQLite triggers to automatically detect and record changes:
- INSERT triggers capture new record insertions
- UPDATE triggers capture modifications to existing records
- DELETE triggers capture record deletions

3. Change Recording:
When a change occurs, the trigger automatically:
- Records the operation type (INSERT, UPDATE, or DELETE)
- Stores the affected table name and record ID
- Captures the full data payload (new/old values for updates)
- Increments the table's version number
- Timestamps the change

4. Delta Extraction:
The system builds change sets by:
- Querying the `__deltasync_changes` table
- Grouping changes by table and operation type
- Including all necessary data for each change
- Tracking change IDs for synchronization

5. Change Processing:
Changes are processed by:
- Organizing them into insertions, updates, and deletions
- Maintaining proper ordering based on timestamps and versions
- Marking changes as synced after successful processing

6. Sync with Server:
- Change sets are sent to the server for conflict resolution
- The server processes and distributes changes to other devices
- Each device tracks its sync state to ensure consistency