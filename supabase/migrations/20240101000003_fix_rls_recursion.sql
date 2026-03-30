-- ============================================
-- RLS無限再帰修正
-- profiles_select_admin_staffがprofiles自身を参照して無限再帰するのを修正
-- SECURITY DEFINER関数を使ってRLSをバイパスする
-- ============================================

-- SECURITY DEFINER関数を作成
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

-- profilesのadmin/staffポリシーを修正
DROP POLICY IF EXISTS "profiles_select_admin_staff" ON public.profiles;
CREATE POLICY "profiles_select_admin_staff" ON public.profiles
  FOR SELECT USING (public.is_admin_or_staff());

-- bookingsのSELECT/UPDATEポリシーを修正
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE USING (customer_id = auth.uid() OR public.is_admin_or_staff());

-- booking_paymentsのポリシーを修正
DROP POLICY IF EXISTS "booking_payments_select" ON public.booking_payments;
CREATE POLICY "booking_payments_select" ON public.booking_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = booking_payments.booking_id AND bookings.customer_id = auth.uid())
    OR public.is_admin_or_staff()
  );

DROP POLICY IF EXISTS "booking_payments_insert_admin" ON public.booking_payments;
CREATE POLICY "booking_payments_insert_admin" ON public.booking_payments
  FOR INSERT WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "booking_payments_update_admin" ON public.booking_payments;
CREATE POLICY "booking_payments_update_admin" ON public.booking_payments
  FOR UPDATE USING (public.is_admin_or_staff());

-- 他テーブルのadminポリシーも修正
DROP POLICY IF EXISTS "menus_insert_admin" ON public.menus;
CREATE POLICY "menus_insert_admin" ON public.menus FOR INSERT WITH CHECK (public.is_admin_or_staff());
DROP POLICY IF EXISTS "menus_update_admin" ON public.menus;
CREATE POLICY "menus_update_admin" ON public.menus FOR UPDATE USING (public.is_admin_or_staff());
DROP POLICY IF EXISTS "menus_delete_admin" ON public.menus;
CREATE POLICY "menus_delete_admin" ON public.menus FOR DELETE USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "staff_insert_admin" ON public.staff;
CREATE POLICY "staff_insert_admin" ON public.staff FOR INSERT WITH CHECK (public.is_admin_or_staff());
DROP POLICY IF EXISTS "staff_update_admin" ON public.staff;
CREATE POLICY "staff_update_admin" ON public.staff FOR UPDATE USING (public.is_admin_or_staff());
DROP POLICY IF EXISTS "staff_delete_admin" ON public.staff;
CREATE POLICY "staff_delete_admin" ON public.staff FOR DELETE USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "business_settings_insert_admin" ON public.business_settings;
CREATE POLICY "business_settings_insert_admin" ON public.business_settings FOR INSERT WITH CHECK (public.is_admin_or_staff());
DROP POLICY IF EXISTS "business_settings_update_admin" ON public.business_settings;
CREATE POLICY "business_settings_update_admin" ON public.business_settings FOR UPDATE USING (public.is_admin_or_staff());
