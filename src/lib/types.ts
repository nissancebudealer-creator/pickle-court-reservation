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
