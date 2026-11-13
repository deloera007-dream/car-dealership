CREATE TYPE public."LoanApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE public.loan_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  car_id TEXT NOT NULL REFERENCES public."Car"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  term INTEGER NOT NULL CHECK (term IN (12, 24, 36, 48, 60, 72, 84)),
  status public."LoanApplicationStatus" NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.loan_applications.term IS 'Loan repayment term in months';

CREATE INDEX loan_applications_user_created_idx
  ON public.loan_applications (user_id, created_at DESC);
CREATE INDEX loan_applications_car_id_idx ON public.loan_applications (car_id);

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.loan_applications FROM anon, authenticated;
GRANT SELECT, INSERT ON public.loan_applications TO authenticated;
GRANT ALL ON public.loan_applications TO service_role;

CREATE POLICY loan_applications_owner_read ON public.loan_applications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = user_id AND u."supabaseAuthUserId" = (SELECT auth.uid())
  ));

CREATE POLICY loan_applications_owner_insert ON public.loan_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'PENDING'
    AND EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = user_id AND u."supabaseAuthUserId" = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public."Car" c
      WHERE c.id = car_id AND c.status = 'AVAILABLE' AND amount <= c.price
    )
  );
