-- ============================================================================
-- Migration: 20260925000000_init_schema.sql
-- Company Pickleball — Employee Court Reservation Schema
-- Timezone: Asia/Manila (PHT, UTC+8)
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
    status TEXT NOT NULL CHECK (status IN ('Active', 'Deactivated')) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Courts Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Sports Annex',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'MAINTENANCE')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Court Slots Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.court_slots (
    id TEXT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_label TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. Reservations Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reservation_date DATE NOT NULL,
    slot_id TEXT NOT NULL REFERENCES public.court_slots(id),
    slot_time TEXT NOT NULL,
    teammates TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
    rejection_reason TEXT,
    cancelled_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 5. Court Blocks Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.court_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    slot_id TEXT REFERENCES public.court_slots(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. System Settings Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_name TEXT NOT NULL DEFAULT 'COMPANY',
    court_brand TEXT NOT NULL DEFAULT 'PICKLEBALL',
    company_logo_url TEXT,
    max_advance_days INT NOT NULL DEFAULT 7,
    max_active_reservations_per_employee INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- ----------------------------------------------------------------------------
-- 7. Indexes & Constraints
-- ----------------------------------------------------------------------------
-- Concurrency lock: Prevent duplicate CONFIRMED bookings for same court, date, slot
CREATE UNIQUE INDEX IF NOT EXISTS unique_confirmed_court_slot 
ON public.reservations (court_id, reservation_date, slot_id) 
WHERE status = 'CONFIRMED';

-- Fast query indexes
CREATE INDEX IF NOT EXISTS idx_reservations_date_court 
ON public.reservations (reservation_date, court_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_status 
ON public.reservations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_court_blocks_date_court 
ON public.court_blocks (block_date, court_id);

-- ----------------------------------------------------------------------------
-- 8. Business Logic Triggers & Functions
-- ----------------------------------------------------------------------------

-- Helper: Check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: When a reservation is CONFIRMED, auto-reject other pending requests for the same slot
CREATE OR REPLACE FUNCTION public.handle_reservation_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CONFIRMED' AND (OLD.status IS DISTINCT FROM 'CONFIRMED') THEN
        UPDATE public.reservations
        SET 
            status = 'REJECTED',
            rejection_reason = 'Slot granted to another applicant',
            cancelled_at = NOW()
        WHERE 
            court_id = NEW.court_id 
            AND reservation_date = NEW.reservation_date 
            AND slot_id = NEW.slot_id 
            AND id <> NEW.id 
            AND status = 'PENDING';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_reject_conflicts ON public.reservations;
CREATE TRIGGER trigger_auto_reject_conflicts
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_approval();

-- Trigger: Policy Enforcement - Non-admins cannot have more than 1 active reservation (PENDING or CONFIRMED)
CREATE OR REPLACE FUNCTION public.enforce_one_active_booking()
RETURNS TRIGGER AS $$
DECLARE
    user_is_admin BOOLEAN;
    active_count INT;
    manila_today DATE;
    max_active INT;
BEGIN
    -- Check if user is admin
    SELECT (role = 'admin') INTO user_is_admin FROM public.profiles WHERE id = NEW.user_id;

    IF user_is_admin IS TRUE THEN
        RETURN NEW;
    END IF;

    -- Only check if this reservation is active (PENDING or CONFIRMED)
    IF NEW.status IN ('PENDING', 'CONFIRMED') THEN
        -- Current date in Asia/Manila
        manila_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE;

        -- Max active allowed (default 1)
        SELECT COALESCE(max_active_reservations_per_employee, 1) INTO max_active FROM public.system_settings WHERE id = 1;
        IF max_active IS NULL THEN
            max_active := 1;
        END IF;

        -- Count existing active bookings for upcoming or today's date
        SELECT COUNT(*) INTO active_count
        FROM public.reservations
        WHERE 
            user_id = NEW.user_id
            AND status IN ('PENDING', 'CONFIRMED')
            AND reservation_date >= manila_today
            AND id <> COALESCE(NEW.id, '');

        IF active_count >= max_active THEN
            RAISE EXCEPTION 'Active booking policy exceeded: Employees can only have % active (Pending or Confirmed) reservation at a time.', max_active;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_one_active_booking ON public.reservations;
CREATE TRIGGER trigger_enforce_one_active_booking
BEFORE INSERT OR UPDATE OF status, reservation_date ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_one_active_booking();

-- Trigger: Auto-populate public.profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        department,
        manager_name,
        mobile_number,
        role,
        status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'manager_name', 'Not Specified'),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', 'Not Specified'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
        'Active'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        manager_name = EXCLUDED.manager_name,
        mobile_number = EXCLUDED.mobile_number,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 9. Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles Policies
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9.2 Courts Policies
CREATE POLICY "Courts viewable by all authenticated users"
ON public.courts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage courts"
ON public.courts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9.3 Court Slots Policies
CREATE POLICY "Court slots viewable by all authenticated users"
ON public.court_slots FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage court slots"
ON public.court_slots FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9.4 Reservations Policies
CREATE POLICY "Reservations viewable by authenticated users"
ON public.reservations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create reservations for themselves"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update or withdraw their own reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full management of reservations"
ON public.reservations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9.5 Court Blocks Policies
CREATE POLICY "Court blocks viewable by authenticated users"
ON public.court_blocks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage court blocks"
ON public.court_blocks FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9.6 System Settings Policies
CREATE POLICY "System settings viewable by authenticated users"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update system settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
