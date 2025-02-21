# PocketSync

PocketSync is a lightweight, event-driven synchronization engine designed for SQLite databases. It efficiently tracks changes, synchronizes data across devices, and ensures consistency even in offline scenarios.

## How PocketSync Works

### System Tables
PocketSync maintains several internal tables to track changes and manage synchronization:

- `__pocketsync_changes`: Stores all table modifications (insertions, updates, deletions).
- `__pocketsync_version`: Maintains versioning for each table (incremented with every mutation).
- `__pocketsync_device_state`: Tracks the unique device ID and the last synchronization timestamp.
- `__pocketsync_processed_changes`: Logs all remote changes that have already been applied to the local device.

### 1. Change Tracking Mechanism
PocketSync attaches triggers to user-defined tables to capture modifications:

- **Insert Triggers**: Track new row insertions.
- **Update Triggers**: Capture modifications to existing rows.
- **Delete Triggers**: Log deletions to ensure proper propagation.

Whenever a change occurs, it is recorded in the `__pocketsync_changes` table.

### 2. Data Identification
PocketSync automatically adds a `ps_global_id` column to each user-defined table. This column is assigned a unique value each time a new row is inserted into any user table. The `ps_global_id` ensures that each row can be uniquely identified across all devices, facilitating seamless synchronization and conflict resolution.

### 3. Sync Operation Triggers
A sync operation is initiated under the following conditions:

- **Real-time Sync:** Every successful database mutation triggers a change listener, which extracts new changes from `__pocketsync_changes` and sends them to the server. Changes are marked as "synced" once the server acknowledges them.
- **Database Listeners:** The same mechanism enables a "watch" feature, allowing users to monitor table-specific changes in real-time.

### 4. Server-Side Change Processing
When a device syncs changes to the server, the following steps occur:

1. The server applies preliminary conflict resolution using a **Last Write Wins** strategy, based on the change version and timestamp.
2. Changes are then broadcasted to all connected devices via a WebSocket channel, ensuring real-time updates.

### 5. Handling Offline Devices
For devices that go offline and later reconnect:

1. The device notifies the server of its last received change timestamp.
2. The server retrieves all changes that occurred since the last sync.
3. Changes are cleaned, merged, and split into batches before being sent to the device.

### 6. Server-Side Data Cleaning & Optimization
To prevent redundant updates and ensure efficient synchronization, the server processes changes before distributing them:

- **Identifying the Most Recent Change Per Row:**
  - If the latest change to a row is a deletion, the row is discarded.
  - Updates to the same row are merged based on timestamps and versions to avoid redundant operations.
- **Ensuring Order Consistency:**
  - Changes are grouped from oldest to newest so that end devices apply them in the correct sequence.

---

PocketSync provides an efficient, low-overhead method for real-time and offline synchronization, ensuring data integrity across distributed SQLite databases.