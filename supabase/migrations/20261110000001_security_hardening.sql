-- Apply after 040_logo_branding.sql (also shipped as a Supabase migration).
-- RLS controls rows, not which columns an owner can change.
CREATE OR REPLACE FUNCTION public.guard_user_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role <> 'USER' THEN
        RAISE EXCEPTION 'Only administrators can assign roles' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW."supabaseAuthUserId" IS DISTINCT FROM OLD."supabaseAuthUserId" THEN
      RAISE EXCEPTION 'Only administrators can change user privileges or identity' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_user_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_user_privileges ON public."User";
CREATE TRIGGER guard_user_privileges
BEFORE INSERT OR UPDATE ON public."User"
FOR EACH ROW EXECUTE FUNCTION public.guard_user_privileges();

DROP POLICY IF EXISTS "user_self_insert" ON public."User";
CREATE POLICY "user_self_insert" ON public."User"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "supabaseAuthUserId" AND role = 'USER');

-- Owners may cancel a booking, but cannot confirm it or move it to another car.
CREATE OR REPLACE FUNCTION public.guard_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF (to_jsonb(NEW) - 'status' - 'updatedAt')
         IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updatedAt')
       OR NEW.status <> 'CANCELLED'
       OR OLD.status NOT IN ('PENDING', 'CONFIRMED') THEN
      RAISE EXCEPTION 'Customers may only cancel pending or confirmed bookings' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_booking_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_booking_update ON public."TestDriveBooking";
CREATE TRIGGER guard_booking_update
BEFORE UPDATE ON public."TestDriveBooking"
FOR EACH ROW EXECUTE FUNCTION public.guard_booking_update();

DROP POLICY IF EXISTS "bookings_create" ON public."TestDriveBooking";
CREATE POLICY "bookings_create" ON public."TestDriveBooking"
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'PENDING' AND EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "TestDriveBooking"."userId"
        AND u."supabaseAuthUserId" = auth.uid()
    )
  );

-- The aggregate bypasses RLS, so only authenticated administrators may call it.
CREATE OR REPLACE FUNCTION public.get_global_storage_usage()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  RETURN (
    COALESCE((SELECT SUM("storage_bytes") FROM public."Car"), 0) +
    COALESCE((SELECT SUM("logoSizeBytes") FROM public."DealershipInfo"), 0)
  )::bigint;
END;
$$;

REVOKE ALL ON FUNCTION public.get_global_storage_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_global_storage_usage() TO authenticated;

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
