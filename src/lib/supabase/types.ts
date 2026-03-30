export type UserRole = "admin" | "staff" | "customer";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  staff_id: string;
  menu_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "visited" | "cancelled" | "no_show";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingPayment {
  id: string;
  booking_id: string;
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  business_hours: Record<string, unknown>;
  holidays: unknown[];
  cancel_policy_hours: number;
  notification_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
