-- Run against a disposable local database after all schema/migration files.
-- Uses Supabase roles and auth.uid(); every fixture is rolled back.
\set ON_ERROR_STOP on
BEGIN;

CREATE FUNCTION pg_temp.expect_denied(statement text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN insufficient_privilege THEN
    RETURN;
  END;
  RAISE EXCEPTION 'Expected insufficient_privilege for: %', statement;
END;
$$;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');
INSERT INTO public."User" (id, "supabaseAuthUserId", email, role) VALUES
  ('audit-owner', '00000000-0000-4000-8000-000000000001', 'owner@audit.invalid', 'USER'),
  ('audit-admin', '00000000-0000-4000-8000-000000000002', 'admin@audit.invalid', 'ADMIN');
INSERT INTO public."Car" (id, "carMakeId", "carColorId", model, year, price, mileage, "fuelType", transmission, "bodyType", "numberPlate", description)
SELECT 'audit-car', m.id, c.id, 'Audit', 2026, 10000, 0, 'Petrol', 'Automatic', 'Sedan', 'AUDIT', 'Test only'
FROM public."CarMake" m CROSS JOIN public."CarColor" c LIMIT 1;
INSERT INTO public."TestDriveBooking" (id, "carId", "userId", "bookingDate", "startTime", "endTime")
VALUES ('audit-booking', 'audit-car', 'audit-owner', CURRENT_DATE + 1, '10:00', '11:00');
INSERT INTO storage.objects (bucket_id, name) VALUES ('car-images', 'audit-public-image');

SET LOCAL ROLE anon;
SELECT pg_temp.expect_denied('SELECT public.get_global_storage_usage()');
SELECT pg_temp.expect_denied($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('car-images', 'audit-anon-upload')$q$);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public."User") THEN RAISE EXCEPTION 'Anonymous user data leak'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE name = 'audit-public-image') THEN RAISE EXCEPTION 'Public image read failed'; END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity) THEN RAISE EXCEPTION 'Application table missing RLS'; END IF;
END $$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
SELECT pg_temp.expect_denied($q$
  INSERT INTO public."User" (id, "supabaseAuthUserId", email, role)
  VALUES ('audit-new', auth.uid(), 'new@audit.invalid', 'ADMIN')
$q$);
INSERT INTO public."User" (id, "supabaseAuthUserId", email)
VALUES ('audit-new', auth.uid(), 'new@audit.invalid');
DO $$ BEGIN
  IF (SELECT role FROM public."User" WHERE id = 'audit-new') <> 'USER' THEN
    RAISE EXCEPTION 'New profile did not default to USER';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT pg_temp.expect_denied($q$UPDATE public."User" SET role = 'ADMIN' WHERE id = 'audit-owner'$q$);
SELECT pg_temp.expect_denied($q$UPDATE public."User" SET id = 'audit-stolen-id' WHERE id = 'audit-owner'$q$);
SELECT pg_temp.expect_denied($q$UPDATE public."User" SET "supabaseAuthUserId" = '00000000-0000-4000-8000-000000000003' WHERE id = 'audit-owner'$q$);
UPDATE public."User" SET name = 'Allowed profile edit' WHERE id = 'audit-owner';
SELECT pg_temp.expect_denied('SELECT public.get_global_storage_usage()');
SELECT pg_temp.expect_denied($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('car-images', 'audit-customer-upload')$q$);
SELECT pg_temp.expect_denied($q$INSERT INTO storage.objects (bucket_id, name) VALUES ('branding-assets', 'audit-customer-logo')$q$);
SELECT pg_temp.expect_denied($q$UPDATE public."TestDriveBooking" SET status = 'CONFIRMED' WHERE id = 'audit-booking'$q$);
SELECT pg_temp.expect_denied($q$UPDATE public."TestDriveBooking" SET "startTime" = '12:00', status = 'CANCELLED' WHERE id = 'audit-booking'$q$);
SELECT pg_temp.expect_denied($q$
  INSERT INTO public."TestDriveBooking" ("carId", "userId", "bookingDate", "startTime", "endTime", status)
  VALUES ('audit-car', 'audit-owner', CURRENT_DATE + 2, '10:00', '11:00', 'COMPLETED')
$q$);
UPDATE public."TestDriveBooking" SET status = 'CANCELLED' WHERE id = 'audit-booking';
SELECT pg_temp.expect_denied($q$UPDATE public."TestDriveBooking" SET status = 'PENDING' WHERE id = 'audit-booking'$q$);
INSERT INTO public."UserSavedCar" ("userId", "carId") VALUES ('audit-owner', 'audit-car');
SELECT pg_temp.expect_denied($q$INSERT INTO public."UserSavedCar" ("userId", "carId") VALUES ('audit-new', 'audit-car')$q$);

-- RLS-filtered writes may legitimately affect zero rows rather than error.
DO $$ BEGIN
  DELETE FROM public."Car" WHERE id = 'audit-car';
  IF FOUND THEN RAISE EXCEPTION 'Customer deleted inventory'; END IF;
  UPDATE public."User" SET name = 'Forbidden' WHERE id = 'audit-admin';
  IF FOUND THEN RAISE EXCEPTION 'Modified another user'; END IF;
  IF (SELECT COUNT(*) FROM public."User") <> 1 THEN RAISE EXCEPTION 'Owner read isolation failed'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
UPDATE public."User" SET role = 'ADMIN' WHERE id = 'audit-new';
UPDATE public."TestDriveBooking" SET status = 'CONFIRMED' WHERE id = 'audit-booking';
SELECT public.get_global_storage_usage();
INSERT INTO storage.objects (bucket_id, name) VALUES ('car-images', 'audit-admin-image'), ('branding-assets', 'audit-admin-logo');
SELECT pg_temp.expect_denied($q$UPDATE storage.objects SET bucket_id = 'unrelated-bucket' WHERE name = 'audit-admin-image'$q$);
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM public."User") <> 3 THEN RAISE EXCEPTION 'Admin read access failed'; END IF;
  IF (SELECT role FROM public."User" WHERE id = 'audit-new') <> 'ADMIN' THEN RAISE EXCEPTION 'Admin role update failed'; END IF;
  IF (SELECT status FROM public."TestDriveBooking" WHERE id = 'audit-booking') <> 'CONFIRMED' THEN RAISE EXCEPTION 'Admin booking update failed'; END IF;
END $$;

ROLLBACK;
SELECT 'Security regression checks passed' AS result;
