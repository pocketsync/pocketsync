1. Initial Shadow Copy:
Create a complete shadow copy of the user’s database when the sync engine starts.

2. Change Detection:
Monitor the user’s database file (via file system watchers or periodic checks) to detect modifications.

3. Diff Calculation:
When a change is detected, compare the current user database with your shadow copy. This can be done by:

    Using the SQLite Backup API for incremental updates, or
    Manually comparing tables (e.g., using primary keys and checksums) to identify inserted, updated, and deleted rows.

4. Delta Extraction:
Build a change set (delta) that records the differences—specifically, the insertions, updates, and deletions detected.

5. Update the Shadow Copy:
Apply the delta changes to the shadow copy so it matches the current state of the user’s database.

6. Sync with the Server:
Send the delta change set to your server for conflict resolution and distribution to other devices.