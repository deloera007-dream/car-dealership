BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT plan(20);

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-111111111111', 'loan-owner@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'loan-other@example.test');
INSERT INTO public."User" (id, "supabaseAuthUserId", email) VALUES
  ('loan-owner', '11111111-1111-4111-8111-111111111111', 'loan-owner@example.test'),
  ('loan-other', '22222222-2222-4222-8222-222222222222', 'loan-other@example.test');
INSERT INTO public."CarMake" (id, name, slug) VALUES ('loan-make', 'Loan Test Make', 'loan-test-make');
INSERT INTO public."CarColor" (id, name, slug) VALUES ('loan-color', 'Loan Test Color', 'loan-test-color');
INSERT INTO public."Car" (id, "carMakeId", "carColorId", model, year, price, mileage, "fuelType", transmission, "bodyType", "numberPlate", description, status) VALUES
  ('loan-car', 'loan-make', 'loan-color', 'Test', 2024, 20000, 100, 'Petrol', 'Manual', 'Sedan', 'LOAN1', 'Test car', 'AVAILABLE'),
  ('loan-sold-car', 'loan-make', 'loan-color', 'Test', 2024, 20000, 100, 'Petrol', 'Manual', 'Sedan', 'LOAN2', 'Sold car', 'SOLD'),
  ('loan-unavailable-car', 'loan-make', 'loan-color', 'Test', 2024, 20000, 100, 'Petrol', 'Manual', 'Sedan', 'LOAN3', 'Unavailable car', 'UNAVAILABLE');

SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-car', 0, 36)$$, '23514', NULL, 'Zero amounts are rejected');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-car', -1, 36)$$, '23514', NULL, 'Negative amounts are rejected');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-car', 100, 13)$$, '23514', NULL, 'Unsupported terms are rejected');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'missing-car', 100, 36)$$, '23503', NULL, 'Car foreign key is enforced');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('missing-user', 'loan-car', 100, 36)$$, '23503', NULL, 'User foreign key is enforced');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
SELECT lives_ok($$INSERT INTO loan_applications (id, user_id, car_id, amount, term) VALUES ('loan-app', 'loan-owner', 'loan-car', 12000.25, 36)$$, 'An authenticated owner can apply');
SELECT is((SELECT status::text FROM loan_applications WHERE id = 'loan-app'), 'PENDING', 'Status defaults to pending');
SELECT ok((SELECT created_at IS NOT NULL FROM loan_applications WHERE id = 'loan-app'), 'Creation time defaults automatically');
SELECT is((SELECT amount FROM loan_applications WHERE id = 'loan-app'), 12000.25::numeric, 'Pence are preserved');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-other', 'loan-car', 100, 36)$$, '42501', NULL, 'Cannot forge application ownership');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term, status) VALUES ('loan-owner', 'loan-car', 100, 36, 'APPROVED')$$, '42501', NULL, 'Cannot self-approve an application');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-sold-car', 100, 36)$$, '42501', NULL, 'Cannot apply for a sold car');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-unavailable-car', 100, 36)$$, '42501', NULL, 'Cannot apply for an unavailable car');
SELECT throws_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-owner', 'loan-car', 20000.01, 36)$$, '42501', NULL, 'Cannot exceed the car price via direct API insert');
SELECT throws_ok($$UPDATE loan_applications SET status = 'APPROVED' WHERE id = 'loan-app'$$, '42501', NULL, 'Owner cannot update application status');
SELECT throws_ok($$DELETE FROM loan_applications WHERE id = 'loan-app'$$, '42501', NULL, 'Owner cannot delete applications');

SET LOCAL request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
SELECT is((SELECT count(*)::integer FROM loan_applications), 0, 'Another user cannot read the owner application');
SELECT lives_ok($$INSERT INTO loan_applications (user_id, car_id, amount, term) VALUES ('loan-other', 'loan-car', 20000, 84)$$, 'Another user can submit their own full-price application');
SELECT is((SELECT count(*)::integer FROM loan_applications), 1, 'Users can read only their own applications');

SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM loan_applications$$, '42501', NULL, 'Guests cannot read applications');

SELECT * FROM finish();
ROLLBACK;
