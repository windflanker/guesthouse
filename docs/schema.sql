-- ============================================================
-- Officers' Guest House — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Admins ──────────────────────────────────────────────────
CREATE TABLE admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    TEXT NOT NULL,           -- bcrypt hash
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rooms ───────────────────────────────────────────────────
-- category: 1 = up to Lt Col (8 rooms)
--           2 = Colonel (2 rooms)
--           3 = Colonel & above (2 rooms)
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(10) UNIQUE NOT NULL,  -- e.g. R-101
  category    SMALLINT NOT NULL CHECK (category IN (1, 2, 3)),
  status      VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'pending', 'occupied')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bookings ─────────────────────────────────────────────────
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref               VARCHAR(20) UNIQUE NOT NULL,   -- BK-0001
  officer_name      VARCHAR(150) NOT NULL,
  rank              VARCHAR(50) NOT NULL,
  unit              VARCHAR(150),
  mobile            VARCHAR(20) NOT NULL,
  email             VARCHAR(150),
  govt_id_type      VARCHAR(50),
  govt_id_number    VARCHAR(60),
  category          SMALLINT NOT NULL CHECK (category IN (1, 2, 3)),
  room_id           UUID REFERENCES rooms(id) ON DELETE SET NULL,
  checkin_date      DATE NOT NULL,
  checkout_date     DATE NOT NULL,
  actual_checkout   DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending', 'approved', 'checked_in',
                        'checked_out', 'cancelled', 'rejected'
                      )),
  cancel_reason     TEXT,
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (checkout_date > checkin_date)
);

-- ── SMS Log ──────────────────────────────────────────────────
CREATE TABLE sms_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  mobile      VARCHAR(20) NOT NULL,
  message     TEXT NOT NULL,
  event_type  VARCHAR(30) NOT NULL,  -- approved, rejected, checkin, checkout, cancelled
  status      VARCHAR(20) DEFAULT 'sent',
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_category ON bookings(category);
CREATE INDEX idx_bookings_checkin  ON bookings(checkin_date);
CREATE INDEX idx_rooms_status      ON rooms(status);
CREATE INDEX idx_rooms_category    ON rooms(category);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed: Rooms ───────────────────────────────────────────────
INSERT INTO rooms (room_number, category) VALUES
  ('R-101', 1), ('R-102', 1), ('R-103', 1), ('R-104', 1),
  ('R-105', 1), ('R-106', 1), ('R-107', 1), ('R-108', 1),
  ('R-201', 2), ('R-202', 2),
  ('R-301', 3), ('R-302', 3);
