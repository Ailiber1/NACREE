-- ============================================
-- RLS ポリシー設定
-- ============================================

-- 全テーブルで RLS を有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- profiles
-- ============================================

-- 自分のprofileを読み取り可能
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- admin/staffは全profile閲覧可能
CREATE POLICY "profiles_select_admin_staff" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

-- 自分のprofileのみ更新可能
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- menus
-- ============================================

-- 全員読み取り可能
CREATE POLICY "menus_select_all" ON public.menus
  FOR SELECT USING (true);

-- adminのみ書き込み可能
CREATE POLICY "menus_insert_admin" ON public.menus
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "menus_update_admin" ON public.menus
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "menus_delete_admin" ON public.menus
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- staff
-- ============================================

-- 全員読み取り可能
CREATE POLICY "staff_select_all" ON public.staff
  FOR SELECT USING (true);

-- adminのみ書き込み可能
CREATE POLICY "staff_insert_admin" ON public.staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "staff_update_admin" ON public.staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "staff_delete_admin" ON public.staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- staff_schedules
-- ============================================

-- 全員読み取り可能
CREATE POLICY "staff_schedules_select_all" ON public.staff_schedules
  FOR SELECT USING (true);

-- admin または本人のみ書き込み可能
CREATE POLICY "staff_schedules_insert_admin_self" ON public.staff_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR staff_id = auth.uid()
  );

CREATE POLICY "staff_schedules_update_admin_self" ON public.staff_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR staff_id = auth.uid()
  );

CREATE POLICY "staff_schedules_delete_admin_self" ON public.staff_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR staff_id = auth.uid()
  );

-- ============================================
-- bookings
-- ============================================

-- 自分の予約のみ読み取り可能。admin/staffは全予約閲覧可能
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 顧客は自分の予約のみ作成可能
CREATE POLICY "bookings_insert_customer" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- 自分のキャンセル or admin/staffが全予約更新可能
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================
-- booking_payments
-- ============================================

-- 自分の支払いのみ閲覧可能。adminは全閲覧可能
CREATE POLICY "booking_payments_select" ON public.booking_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_payments.booking_id
      AND bookings.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- adminのみ書き込み（Webhook経由でservice_roleで書き込むが、フォールバック用）
CREATE POLICY "booking_payments_insert_admin" ON public.booking_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "booking_payments_update_admin" ON public.booking_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- reviews
-- ============================================

-- 全員読み取り可能
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

-- 自分のレビューのみ書き込み可能
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (customer_id = auth.uid());

-- ============================================
-- business_settings
-- ============================================

-- 全員読み取り可能
CREATE POLICY "business_settings_select_all" ON public.business_settings
  FOR SELECT USING (true);

-- adminのみ書き込み可能
CREATE POLICY "business_settings_insert_admin" ON public.business_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "business_settings_update_admin" ON public.business_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
