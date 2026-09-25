export type UserRole = 'employee' | 'admin';
export type UserStatus = 'Active' | 'Deactivated';
export type CourtStatus = 'ACTIVE' | 'MAINTENANCE';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string;
  manager_name: string;
  mobile_number: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  name: string;
  location: string;
  status: CourtStatus;
  created_at: string;
}

export interface CourtSlot {
  id: string;
  start_time: string;
  end_time: string;
  display_label: string;
}

export interface Reservation {
  id: string;
  court_id: string;
  user_id: string;
  reservation_date: string;
  slot_id: string;
  slot_time: string;
  teammates: string;
  status: ReservationStatus;
  rejection_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  approved_at: string | null;
  cancelled_at: string | null;
  // Joins
  profile?: Profile;
  court?: Court;
}

export interface CourtBlock {
  id: string;
  court_id: string | null;
  block_date: string;
  slot_id: string | null;
  reason: string;
  created_by: string | null;
  created_at: string;
  court?: Court | null;
}

export interface SystemSettings {
  id: number;
  company_name: string;
  court_brand: string;
  company_logo_url: string | null;
  max_advance_days: number;
  max_active_reservations_per_employee: number;
  updated_at: string;
}

export interface CustomProperty {
  id: string;
  key: string;
  label: string;
  value: string;
  description?: string;
}

export interface UILabels {
  // Authentication & Global
  booking_header?: string;
  booking_sub?: string;
  registration_header?: string;
  registration_sub?: string;
  facility_subtitle?: string;
  operating_schedule_footer?: string;
  email_footer_notice?: string;

  // Form Fields
  field_full_name?: string;
  field_corporate_email?: string;
  field_password?: string;
  field_department?: string;
  field_manager?: string;
  field_mobile?: string;
  field_teammates?: string;
  field_teammates_placeholder?: string;
  field_teammates_help?: string;
  field_operating_time?: string;
  field_court_location?: string;

  // Actions & Buttons
  btn_reserve_slot?: string;
  btn_withdraw_request?: string;
  btn_cancel_booking?: string;
  btn_sign_in?: string;
  btn_create_account?: string;
}

export interface UINavigationLabels {
  court_schedule?: string;
  my_reservations?: string;
  admin_portal?: string;
  admin_overview?: string;
  admin_reservations?: string;
  admin_employees?: string;
  admin_courts?: string;
  admin_settings?: string;
}

export interface UIProperties {
  departments: string[];
  navigation: UINavigationLabels;
  labels: UILabels;
  custom_properties: CustomProperty[];
}

export const COMPANY_DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance & Accounting',
  'Marketing & Sales',
  'Operations & Logistics',
  'Legal & Compliance',
  'Product & Design',
  'Customer Support',
  'Facilities & Admin',
  'Executive Leadership',
] as const;

