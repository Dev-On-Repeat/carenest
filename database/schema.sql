-- ==============================================================================
-- CareNest AI — Master Relational Database Schema
-- Compatible with Supabase PostgreSQL (with Row Level Security) and SQLite
-- ==============================================================================

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'elderly' CHECK (role IN ('elderly', 'caregiver', 'admin')),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(50),
    phone VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'te')),
    text_size VARCHAR(20) DEFAULT 'large' CHECK (text_size IN ('normal', 'large', 'xlarge')),
    caregiver_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_caregiver_code ON profiles(caregiver_code);

-- 2. MEDICINES
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    strength VARCHAR(100),
    dosage VARCHAR(100) NOT NULL DEFAULT '1 tablet',
    frequency VARCHAR(100) NOT NULL DEFAULT 'Once daily',
    scheduled_times VARCHAR(255) NOT NULL DEFAULT '08:00',
    meal_timing VARCHAR(50) DEFAULT 'after_food' CHECK (meal_timing IN ('before_food', 'after_food', 'with_food', 'not_specified')),
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50),
    instructions TEXT,
    prescribing_doctor VARCHAR(255),
    pill_shape VARCHAR(50) DEFAULT 'round' CHECK (pill_shape IN ('round', 'oval', 'capsule', 'square')),
    pill_color VARCHAR(50) DEFAULT 'teal' CHECK (pill_color IN ('teal', 'white', 'yellow', 'blue', 'red')),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);

-- 3. MEDICATION SCHEDULES
CREATE TABLE IF NOT EXISTS medication_schedules (
    id SERIAL PRIMARY KEY,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    time_of_day VARCHAR(10) NOT NULL,
    days_of_week VARCHAR(100) DEFAULT 'mon,tue,wed,thu,fri,sat,sun',
    dose_quantity VARCHAR(50) DEFAULT '1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_time ON medication_schedules(user_id, time_of_day);

-- 4. MEDICATION EVENTS (HISTORY AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS medication_events (
    id SERIAL PRIMARY KEY,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_time VARCHAR(50) NOT NULL,
    action_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN ('taken', 'snoozed', 'missed')),
    notes TEXT,
    device_source VARCHAR(50) DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_user_action ON medication_events(user_id, action_time);
CREATE INDEX IF NOT EXISTS idx_events_medicine_id ON medication_events(medicine_id);

-- 5. PRESCRIPTIONS & OCR DATA
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    ocr_raw_text TEXT,
    extracted_data_json TEXT,
    doctor_name VARCHAR(255),
    clinic_name VARCHAR(255),
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);

-- 6. CAREGIVER RELATIONSHIPS
CREATE TABLE IF NOT EXISTS caregiver_relationships (
    id SERIAL PRIMARY KEY,
    caregiver_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    elderly_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'revoked')),
    permissions VARCHAR(50) DEFAULT 'manage' CHECK (permissions IN ('read', 'manage')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_caregiver_elderly UNIQUE(caregiver_id, elderly_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_rel_ids ON caregiver_relationships(caregiver_id, elderly_id);

-- 7. SOS EMERGENCY EVENTS
CREATE TABLE IF NOT EXISTS sos_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'triggered' CHECK (status IN ('triggered', 'acknowledged', 'resolved')),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    notes TEXT,
    external_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sos_events_user ON sos_events(user_id, status);

-- 8. OFFLINE SYNC AUDIT LOG
CREATE TABLE IF NOT EXISTS sync_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user ON sync_events(user_id, client_timestamp);

-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- Medicines Policy: Elderly can manage own; Caregiver can read linked patient medicines
CREATE POLICY medicines_owner_access ON medicines
    FOR ALL
    USING (auth.uid() = user_id::text);

-- Events Policy: User can record/view own medication events
CREATE POLICY events_owner_access ON medication_events
    FOR ALL
    USING (auth.uid() = user_id::text);

