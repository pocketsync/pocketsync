CREATE TABLE projects (
    api_key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_users (
    user_identifier VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(64) REFERENCES projects(api_key),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
    device_id VARCHAR(255) PRIMARY KEY,
    user_identifier VARCHAR(255) REFERENCES app_users(user_identifier),
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_databases (
    user_identifier VARCHAR(255) PRIMARY KEY REFERENCES app_users(user_identifier), 
    data BLOB,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE change_log (
    id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) REFERENCES app_users(user_identifier),
    device_id VARCHAR(255) REFERENCES devices(device_id),
    change_set JSONB,  -- Diff data (insertions, updates, deletions)
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE device_change_log (
    id SERIAL PRIMARY KEY,
    device_id INT REFERENCES devices(id) ON DELETE CASCADE,
    last_processed_change_id INT REFERENCES change_log(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
