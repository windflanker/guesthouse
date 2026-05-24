-- Officers' Guest House — PostgreSQL Schema
-- Run: psql -U postgres -d guesthouse -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE room_status AS ENUM ('available', 'pending', 'occupied');
CREATE TYPE booking_status AS ENUM (
  'Pending', 'Approved', 'Rejected', 'Checked In', 'Checked Out', 'Cancelled'
);
CREATE TYPE officer_rank AS ENUM (
  '2Lt', 'Lt', 'Capt', 'Major', 'Lt Col',
  'Colonel',
  'Brigadier', 'Maj Gen', 'Lt Gen', 'General'
);
CREATE TYPE id_type AS ENUM ('Service ID card', 'Aadhaar card', 'Passport');

-- ─── Users (admins) ───────────────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,           -- bcrypt hash
  role        TEXT NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Rooms ────────────────────────────────────────────────────────────────────

CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no     TEXT UNIQUE NOT NULL,    -- e.g. R-101
  category    SMALLINT NOT NULL CHECK (category IN (1, 2, 3)),
  status      room_status NOT NULL DEFAULT 'available',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed rooms
INSERT INTO rooms (room_no, category) VALUES
  ('R-101', 1), ('R-102', 1), ('R-103', 1), ('R-104', 1),
  ('R-105', 1), ('R-106', 1), ('R-107', 1), ('R-108', 1),
  ('R-201', 2), ('R-202', 2),
  ('R-301', 3), ('R-302', 3);

-- ─── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref                 TEXT UNIQUE NOT NULL,           -- BK-0001, BK-0002, ...
  officer_name        TEXT NOT NULL,
  rank                officer_rank NOT NULL,
  unit                TEXT NOT NULL,
  mobile              TEXT NOT NULL,
  email               TEXT,
  id_type             id_type,
  id_number           TEXT,
  category            SMALLINT NOT NULL CHECK (category IN (1, 2, 3)),
  room_id             UUID REFERENCES rooms(id),
  checkin_date        DATE NOT NULL,
  checkout_date       DATE NOT NULL,
  actual_checkout     DATE,
  status              booking_status NOT NULL DEFAULT 'Pending',
  cancel_reason       TEXT,
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT checkout_after_checkin CHECK (checkout_date > checkin_date)
);

-- Auto-generate booking ref
CREATE SEQUENCE booking_ref_seq START 1;

CREATE OR REPLACE FUNCTION set_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref IS NULL OR NEW.ref = '' THEN
    NEW.ref := 'BK-' || LPAD(nextval('booking_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_ref
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_ref();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── SMS Log ──────────────────────────────────────────────────────────────────

CREATE TABLE sms_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id),
  mobile      TEXT NOT NULL,
  event       TEXT NOT NULL,           -- approved, checkin, checkout, cancelled
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued',  -- queued, sent, failed
  provider_id TEXT,                    -- MSG91 response ID
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_category   ON bookings(category);
CREATE INDEX idx_bookings_checkin    ON bookings(checkin_date);
CREATE INDEX idx_bookings_room       ON bookings(room_id);
CREATE INDEX idx_sms_booking         ON sms_log(booking_id);
CREATE INDEX idx_rooms_category      ON rooms(category);
CREATE INDEX idx_rooms_status        ON rooms(status);

-- ─── Seed admin user (password: Admin@1234) ───────────────────────────────────
-- Hash generated with bcrypt rounds=12. Change before production.

INSERT INTO users (name, email, password, role) VALUES (
  'Admin',
  'admin@guesthouse.mil',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMN9R1XkqJOb6UaG1bR7DKXVBO',
  'admin'
);
