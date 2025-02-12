# DeltaSync Changeset Structure

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
                    "id": "row1_id",
                    "field1": "value1",
                    "field2": "value2"
                },
                {
                    "id": "row2_id",
                    "field1": "value3",
                    "field2": "value4"
                }
            ]
        }
    },
    "updates": {
        "table1": {
            "rows": [
                {
                    "id": "row1_id",
                    "field1": "updated_value1",
                    "field2": "updated_value2"
                }
            ]
        }
    },
    "deletions": {
        "table1": {
            "rows": [
                {
                    "id": "row3_id"
                }
            ]
        }
    }
}
```

## Fields Description

- `timestamp`: Unix timestamp (in milliseconds) when the changeset was created
- `version`: Version number of the changeset
- `insertions`: Object containing table names as keys and their corresponding inserted rows
- `updates`: Object containing table names as keys and their corresponding updated rows
- `deletions`: Object containing table names as keys and their corresponding deleted row IDs

### Row Structure

- For insertions: Complete row data including all fields
- For updates: Complete row data with updated fields
- For deletions: Only the row ID is required

Each row must contain an `id` field that uniquely identifies the row within its table.