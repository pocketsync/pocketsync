# PocketSync Changeset Structure

A changeset represents a collection of changes made to the database tables. It includes insertions, updates, and deletions across multiple tables.

## Structure

```json
{
    "timestamp": 1234567890,
    "version": 1,
    "insertions": {
        "table1": {
            "rows": [
                {
                    "primaryKey": "row1_id",
                    "timestamp": 1234567890,
                    "version": 1,
                    "data": {
                        "field1": "value1",
                        "field2": "value2"
                    }
                },
                {
                    "primaryKey": "row2_id",
                    "timestamp": 1234567890,
                    "version": 1,
                    "data": {
                        "field1": "value3",
                        "field2": "value4"
                    }
                }
            ]
        }
    },
    "updates": {
        "table1": {
            "rows": [
                {
                    "primaryKey": "row1_id",
                    "timestamp": 1234567890,
                    "version": 1,
                    "data": {
                        "field1": "updated_value1",
                        "field2": "updated_value2"
                    }
                }
            ]
        }
    },
    "deletions": {
        "table1": {
            "rows": [
                {
                    "primaryKey": "row3_id",
                    "timestamp": 1234567890,
                    "version": 1,
                    "data": {}
                }
            ]
        }
    }
}
```

## Fields Description

### Changeset Level
- `timestamp`: Unix timestamp (in milliseconds) when the changeset was created
- `version`: Version number of the changeset
- `insertions`: Object containing table names as keys and their corresponding inserted rows
- `updates`: Object containing table names as keys and their corresponding updated rows
- `deletions`: Object containing table names as keys and their corresponding deleted rows

### Row Level
- `primaryKey`: Unique identifier for the row within its table
- `timestamp`: Unix timestamp (in milliseconds) when the row was modified
- `version`: Version number of the row
- `data`: Object containing the actual row data with field names and their values

### Table Structure
Each table in the insertions, updates, or deletions object contains:
- `rows`: Array of row objects with the structure described above

All operations (insertions, updates, and deletions) follow the same row structure, with deletions typically containing minimal data in the data object.