'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { generateReservationId } from '@/lib/timezone';
import { sendApprovalNotice } from '@/lib/email';
import { CourtStatus, UserStatus } from '@/lib/types';

/**
 * Verify current session has admin role
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { admin: false, error: 'Unauthorized: Session missing' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { admin: false, error: 'Unauthorized: Admin privileges required' };
  }

  return { admin: true, user, profile, error: null };
}

/**
 * 1. Admin Reset User Password
 */
export async function adminResetPasswordAction({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!newPassword || newPassword.length < 8) {
      return { error: 'Temporary password must be at least 8 characters long.' };
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('[Admin Reset Password Error]', error);
      return { error: error.message };
    }

    revalidatePath('/admin/employees');
    return { success: true, message: 'Password has been successfully updated.' };
  } catch (err: any) {
    return { error: err.message || 'Failed to update user password.' };
  }
}

/**
 * 2. Deactivate / Activate User
 */
export async function toggleUserStatusAction({
  userId,
  newStatus,
}: {
  userId: string;
  newStatus: UserStatus;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update user status.' };
  }
}

/**
 * 3. Add Court
 */
export async function addCourtAction({
  name,
  location,
  status = 'ACTIVE',
}: {
  name: string;
  location: string;
  status?: CourtStatus;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!name || name.trim().length === 0) {
      return { error: 'Court name is required.' };
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('courts')
      .insert({
        name: name.trim(),
        location: location.trim() || 'Sports Annex',
        status,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/admin/courts');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, court: data };
  } catch (err: any) {
    return { error: err.message || 'Failed to add court.' };
  }
}

/**
 * 4. Update Court
 */
export async function updateCourtAction({
  courtId,
  name,
  location,
  status,
}: {
  courtId: string;
  name: string;
  location: string;
  status: CourtStatus;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('courts')
      .update({
        name: name.trim(),
        location: location.trim(),
        status,
      })
      .eq('id', courtId);

    if (error) return { error: error.message };

    revalidatePath('/admin/courts');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update court.' };
  }
}

/**
 * 5. Block Slot or Day
 */
export async function blockSlotAction({
  courtId,
  date,
  slotId,
  reason,
}: {
  courtId?: string | null;
  date: string;
  slotId?: string | null;
  reason: string;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!date) return { error: 'Date is required.' };
    if (!reason || reason.trim().length === 0) return { error: 'Reason for blocking is required.' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from('court_blocks').insert({
      court_id: courtId || null,
      block_date: date,
      slot_id: slotId || null,
      reason: reason.trim(),
      created_by: authCheck.profile?.id,
    });

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to block slot.' };
  }
}

/**
 * 6. Remove Block
 */
export async function unblockSlotAction({ blockId }: { blockId: string }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from('court_blocks').delete().eq('id', blockId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to unblock slot.' };
  }
}

/**
 * 7. Admin Direct Booking
 */
export async function adminDirectBookAction({
  courtId,
  userId,
  date,
  slotId,
  teammates,
}: {
  courtId: string;
  userId: string;
  date: string;
  slotId: string;
  teammates: string;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();

    // Fetch slot
    const { data: slot } = await adminSupabase
      .from('court_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (!slot) return { error: 'Invalid slot' };

    // Fetch court
    const { data: court } = await adminSupabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (!court) return { error: 'Invalid court' };

    // Fetch user profile
    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!targetProfile) return { error: 'Target employee not found' };

    // Generate ticket ID
    const reservationId = generateReservationId(date);

    // Insert directly as CONFIRMED
    const { error: insertError } = await adminSupabase.from('reservations').insert({
      id: reservationId,
      court_id: courtId,
      user_id: userId,
      reservation_date: date,
      slot_id: slotId,
      slot_time: slot.display_label,
      teammates: teammates.trim(),
      status: 'CONFIRMED',
      approved_at: new Date().toISOString(),
    });

    if (insertError) {
      return { error: insertError.message };
    }

    // Send confirmation notice
    sendApprovalNotice({
      employeeEmail: targetProfile.email,
      employeeName: targetProfile.full_name,
      reservationId,
      courtName: court.name,
      courtLocation: court.location,
      reservationDate: date,
      slotTime: slot.display_label,
      teammates: teammates.trim(),
    }).catch(console.error);

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');

    return { success: true, reservationId };
  } catch (err: any) {
    return { error: err.message || 'Failed to complete direct booking.' };
  }
}

/**
 * 8. Update System Settings
 */
export async function updateSystemSettingsAction({
  companyName,
  courtBrand,
  companyLogoUrl,
  maxAdvanceDays,
  maxActiveReservations,
}: {
  companyName: string;
  courtBrand: string;
  companyLogoUrl: string | null;
  maxAdvanceDays: number;
  maxActiveReservations: number;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('system_settings')
      .upsert({
        id: 1,
        company_name: companyName.trim(),
        court_brand: courtBrand.trim(),
        company_logo_url: companyLogoUrl ? companyLogoUrl.trim() : null,
        max_advance_days: Number(maxAdvanceDays),
        max_active_reservations_per_employee: Number(maxActiveReservations),
        updated_at: new Date().toISOString(),
      });

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update settings.' };
  }
}
