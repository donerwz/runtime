CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('volunteer', 'supervisor')),
    supervisor_id   UUID REFERENCES users(id),
    api_token_hash  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cohorts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id   UUID NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cohort_members (
    cohort_id   UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (cohort_id, user_id)
);

CREATE TABLE IF NOT EXISTS heartbeats (
    ts          TIMESTAMPTZ NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id),
    app_name    TEXT NOT NULL,
    app_bundle  TEXT,
    focused     BOOLEAN NOT NULL,
    project     TEXT,
    language    TEXT,
    file_ext    TEXT
);
SELECT create_hypertable('heartbeats', 'ts', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS heartbeats_user_ts ON heartbeats (user_id, ts DESC);

CREATE TABLE IF NOT EXISTS shifts (
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    tracked_minutes     INT NOT NULL DEFAULT 0,
    approved_minutes    INT,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'adjusted')),
    PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS daily_assessments (
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    scores      JSONB,
    summary     TEXT,
    evidence    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, date)
);

-- Computes tracked minutes per day for a user.
-- For each consecutive heartbeat pair within a day, adds the gap capped at 2 minutes.
CREATE OR REPLACE FUNCTION tracked_minutes_per_day(
    p_user_id   UUID,
    p_from      DATE,
    p_to        DATE
)
RETURNS TABLE(date DATE, tracked_minutes INT) AS $$
    SELECT
        (ts AT TIME ZONE 'UTC')::date                       AS date,
        SUM(LEAST(gap_secs / 60.0, 2.0))::int              AS tracked_minutes
    FROM (
        SELECT
            ts,
            EXTRACT(EPOCH FROM (
                ts - LAG(ts) OVER (
                    PARTITION BY user_id, (ts AT TIME ZONE 'UTC')::date
                    ORDER BY ts
                )
            )) AS gap_secs
        FROM heartbeats
        WHERE user_id = p_user_id
          AND ts >= p_from::timestamptz
          AND ts <  (p_to + INTERVAL '1 day')::timestamptz
    ) gaps
    WHERE gap_secs IS NOT NULL AND gap_secs > 0
    GROUP BY (ts AT TIME ZONE 'UTC')::date
    ORDER BY 1
$$ LANGUAGE sql STABLE;
