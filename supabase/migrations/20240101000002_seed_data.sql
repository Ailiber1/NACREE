-- ============================================
-- 初期データ（ダミーデータ）
-- ============================================

-- メニューデータ
INSERT INTO public.menus (name, description, price, duration_min, image_url, is_active, sort_order) VALUES
  ('フェイシャルトリートメント', '毛穴ケア・美白・ハリ改善をお一人おひとりの肌質に合わせて', 18000, 60, '/images/menu-facial.jpg', true, 1),
  ('アロマボディケア', '厳選オーガニックオイルで全身の巡りを整える', 24000, 90, '/images/menu-body.jpg', true, 2),
  ('プレミアムコース', 'フェイシャル+ボディのフルコース。至福の時間', 38000, 120, '/images/menu-premium.jpg', true, 3);

-- ビジネス設定
INSERT INTO public.business_settings (business_hours, holidays, cancel_policy_hours, notification_settings) VALUES
  (
    '{"monday": {"open": "10:00", "close": "20:00"}, "tuesday": {"open": "10:00", "close": "20:00"}, "wednesday": {"open": "10:00", "close": "20:00"}, "thursday": {"open": "10:00", "close": "20:00"}, "friday": {"open": "10:00", "close": "20:00"}, "saturday": {"open": "10:00", "close": "20:00"}, "sunday": {"open": "10:00", "close": "20:00"}}',
    '[]',
    24,
    '{"email_confirmation": true, "email_reminder": true, "reminder_hours_before": 24}'
  );
