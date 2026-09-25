-- ============================================================================
-- Supabase Seed Data: Company Pickleball
-- Seed initial courts, slots, system settings, demo profiles and reservations
-- ============================================================================

-- 1. Insert System Settings
INSERT INTO public.system_settings (
    id,
    company_name,
    court_brand,
    company_logo_url,
    max_advance_days,
    max_active_reservations_per_employee
) VALUES (
    1,
    'COMPANY',
    'PICKLEBALL',
    NULL,
    7,
    1
) ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    court_brand = EXCLUDED.court_brand,
    max_advance_days = EXCLUDED.max_advance_days,
    max_active_reservations_per_employee = EXCLUDED.max_active_reservations_per_employee;

-- 2. Insert Operating Slots
INSERT INTO public.court_slots (id, start_time, end_time, display_label) VALUES
    ('slot-1', '17:30:00', '18:30:00', '5:30 PM – 6:30 PM'),
    ('slot-2', '18:30:00', '19:30:00', '6:30 PM – 7:30 PM'),
    ('slot-3', '19:30:00', '20:30:00', '7:30 PM – 8:30 PM')
ON CONFLICT (id) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    display_label = EXCLUDED.display_label;

-- 3. Insert Initial Courts
INSERT INTO public.courts (id, name, location, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Company Pickleball Court 1', 'Sports Annex - Ground Floor', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222222', 'Company Pickleball Court 2', 'Sports Annex - 2nd Level', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    status = EXCLUDED.status;

-- 4. Insert Seed Auth Users & Profiles (Password: "CompanyPass123!")
DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    juan_id UUID  := '00000000-0000-0000-0000-000000000002';
    maria_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
    -- Only insert into auth.users if running in a Supabase environment with auth schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES
        (
            '00000000-0000-0000-0000-000000000000',
            admin_id,
            'authenticated',
            'authenticated',
            'admin.carlos@company.com',
            crypt('CompanyPass123!', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Carlos Mendoza","department":"Facilities & Operations","manager_name":"VP Operations","mobile_number":"+63 917 111 2233","role":"admin"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            juan_id,
            'authenticated',
            'authenticated',
            'juan.delacruz@company.com',
            crypt('CompanyPass123!', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Juan Dela Cruz","department":"Engineering","manager_name":"Tech Lead Alex","mobile_number":"+63 917 222 3344","role":"employee"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            maria_id,
            'authenticated',
            'authenticated',
            'maria.santos@company.com',
            crypt('CompanyPass123!', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Maria Santos","department":"Human Resources","manager_name":"HR Director Grace","mobile_number":"+63 917 333 4455","role":"employee"}',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data;

        -- Also ensure auth.identities is populated for Supabase GoTrue Auth
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES
            (
                admin_id,
                admin_id,
                format('{"sub":"%s","email":"%s"}', admin_id, 'admin.carlos@company.com')::jsonb,
                'email',
                admin_id,
                NOW(),
                NOW(),
                NOW()
            ),
            (
                juan_id,
                juan_id,
                format('{"sub":"%s","email":"%s"}', juan_id, 'juan.delacruz@company.com')::jsonb,
                'email',
                juan_id,
                NOW(),
                NOW(),
                NOW()
            ),
            (
                maria_id,
                maria_id,
                format('{"sub":"%s","email":"%s"}', maria_id, 'maria.santos@company.com')::jsonb,
                'email',
                maria_id,
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;

    -- Upsert Public Profiles
    INSERT INTO public.profiles (id, full_name, email, department, manager_name, mobile_number, role, status) VALUES
    (
        admin_id,
        'Carlos Mendoza',
        'admin.carlos@company.com',
        'Facilities & Operations',
        'VP Operations',
        '+63 917 111 2233',
        'admin',
        'Active'
    ),
    (
        juan_id,
        'Juan Dela Cruz',
        'juan.delacruz@company.com',
        'Engineering',
        'Tech Lead Alex',
        '+63 917 222 3344',
        'employee',
        'Active'
    ),
    (
        maria_id,
        'Maria Santos',
        'maria.santos@company.com',
        'Human Resources',
        'HR Director Grace',
        '+63 917 333 4455',
        'employee',
        'Active'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department = EXCLUDED.department,
        manager_name = EXCLUDED.manager_name,
        mobile_number = EXCLUDED.mobile_number,
        role = EXCLUDED.role,
        status = EXCLUDED.status;

    -- 5. Insert Sample Reservations for Current & Upcoming Dates
    INSERT INTO public.reservations (
        id,
        court_id,
        user_id,
        reservation_date,
        slot_id,
        slot_time,
        teammates,
        status,
        created_at,
        approved_at
    ) VALUES
    (
        'PB-SEED-001',
        '11111111-1111-1111-1111-111111111111',
        maria_id,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE + 1,
        'slot-1',
        '5:30 PM – 6:30 PM',
        'Grace Reyes, Mark Ramos, Sarah Lim',
        'CONFIRMED',
        NOW(),
        NOW()
    ),
    (
        'PB-SEED-002',
        '11111111-1111-1111-1111-111111111111',
        juan_id,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE + 2,
        'slot-2',
        '6:30 PM – 7:30 PM',
        'Carlo Tan, Bianca Perez, Kevin Co',
        'PENDING',
        NOW(),
        NULL
    )
    ON CONFLICT (id) DO NOTHING;

END $$;
