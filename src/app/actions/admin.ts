'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { generateReservationId } from '@/lib/timezone';
import { sendApprovalNotice } from '@/lib/email';
import { CourtStatus, UserStatus, UIProperties, UserRole } from '@/lib/types';


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
 * 2a. Update Employee Role (Admin / Employee)
 */
export async function updateEmployeeRoleAction({
  userId,
  newRole,
}: {
  userId: string;
  newRole: UserRole;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    // Prevent admin from demoting themselves
    if (userId === authCheck.user?.id && newRole !== 'admin') {
      return { error: 'You cannot remove your own administrative privileges.' };
    }

    const adminSupabase = createAdminClient();

    // Update profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) return { error: profileError.message };

    // Sync auth metadata
    await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update employee role.' };
  }
}

/**
 * 2b. Update Full Employee Details
 */
export async function updateEmployeeDetailsAction({
  userId,
  fullName,
  email,
  department,
  managerName,
  mobileNumber,
  role,
  status,
}: {
  userId: string;
  fullName: string;
  email: string;
  department: string;
  managerName: string;
  mobileNumber: string;
  role: UserRole;
  status: UserStatus;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!fullName || fullName.trim().length < 2) {
      return { error: 'Full name must be at least 2 characters.' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { error: 'Please enter a valid email address.' };
    }

    const cleanedMobile = mobileNumber.replace(/\s+/g, '');
    const mobileRegex = /^(\+639|09)\d{9}$/;
    if (!mobileRegex.test(cleanedMobile)) {
      return { error: 'Invalid mobile number. Use a Philippine format: 09XXXXXXXXX or +639XXXXXXXXX.' };
    }

    // Prevent admin from demoting or deactivating themselves
    if (userId === authCheck.user?.id) {
      if (role !== 'admin') {
        return { error: 'You cannot remove your own administrative privileges.' };
      }
      if (status !== 'Active') {
        return { error: 'You cannot deactivate your own account.' };
      }
    }

    const adminSupabase = createAdminClient();

    // Check if email changed; if so, update Auth user email
    const { data: currentProfile } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (currentProfile && currentProfile.email !== trimmedEmail) {
      const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(userId, {
        email: trimmedEmail,
        email_confirm: true,
      });
      if (authUpdateError) {
        return { error: `Failed to update auth email: ${authUpdateError.message}` };
      }
    }

    // Update profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        email: trimmedEmail,
        department: department.trim(),
        manager_name: managerName.trim(),
        mobile_number: cleanedMobile,
        role,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) return { error: profileError.message };

    // Update user_metadata in Auth
    await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: fullName.trim(),
        department: department.trim(),
        manager_name: managerName.trim(),
        mobile_number: cleanedMobile,
        role,
      },
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update employee details.' };
  }
}

/**
 * 2c. Delete Employee
 */
export async function deleteEmployeeAction({ userId }: { userId: string }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    // Prevent self-deletion
    if (userId === authCheck.user?.id) {
      return { error: 'You cannot delete your own account while logged in.' };
    }

    const adminSupabase = createAdminClient();

    // Check if user has active/future reservations
    const { count: activeReservations } = await adminSupabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['PENDING', 'CONFIRMED']);

    if (activeReservations && activeReservations > 0) {
      return {
        error: `Cannot delete employee: they have ${activeReservations} active reservation(s) (Pending or Confirmed). Please cancel or reassign them first.`,
      };
    }

    // Clean up historical reservations (completed, rejected, cancelled) to satisfy FK restrict
    await adminSupabase
      .from('reservations')
      .delete()
      .eq('user_id', userId);

    // Delete user from Auth (cascades to profiles)
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.warn('[deleteEmployeeAction] auth delete error, falling back to profile delete:', deleteAuthError);
    }

    // Explicitly delete from profiles just in case
    await adminSupabase.from('profiles').delete().eq('id', userId);

    revalidatePath('/admin/employees');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete employee.' };
  }
}

/**
 * 2d. Create / Invite New Employee
 */
export async function createEmployeeAction({
  fullName,
  email,
  password,
  department,
  managerName,
  mobileNumber,
  role = 'employee',
}: {
  fullName: string;
  email: string;
  password: string;
  department: string;
  managerName: string;
  mobileNumber: string;
  role?: UserRole;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!fullName || fullName.trim().length < 2) {
      return { error: 'Full name must be at least 2 characters.' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 8) {
      return { error: 'Temporary password must be at least 8 characters long.' };
    }

    const cleanedMobile = mobileNumber.replace(/\s+/g, '');
    const mobileRegex = /^(\+639|09)\d{9}$/;
    if (!mobileRegex.test(cleanedMobile)) {
      return { error: 'Invalid mobile number. Use a Philippine format: 09XXXXXXXXX or +639XXXXXXXXX.' };
    }

    const adminSupabase = createAdminClient();

    // Check if user already exists in profiles
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (existingUser) {
      return { error: 'An employee with this email already exists.' };
    }

    // Create user in Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        department: department.trim(),
        manager_name: managerName.trim(),
        mobile_number: cleanedMobile,
        role,
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || 'Failed to create auth user.' };
    }

    // Insert or update profile
    const { error: profileError } = await adminSupabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: fullName.trim(),
      email: trimmedEmail,
      department: department.trim(),
      manager_name: managerName.trim(),
      mobile_number: cleanedMobile,
      role,
      status: 'Active',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return { error: profileError.message };
    }

    revalidatePath('/admin/employees');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to create employee profile.' };
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
    revalidatePath('/login');
    revalidatePath('/register');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update settings.' };
  }
}

/**
 * 9. Update UI Properties (Departments, Navigation, Field Labels, Custom Properties)
 */
export async function updateUIPropertiesAction(properties: UIProperties) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const { saveUIProperties } = await import('@/lib/ui-properties');
    const result = await saveUIProperties(properties);

    if (!result.success) {
      return { error: result.error || 'Failed to persist UI properties.' };
    }

    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/courts');
    revalidatePath('/admin/employees');
    revalidatePath('/admin/reservations');
    revalidatePath('/login');
    revalidatePath('/register');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update UI properties.' };
  }
}

/**
 * 10. Add Court Slot
 */
export async function addCourtSlotAction({
  id,
  startTime,
  endTime,
  displayLabel,
}: {
  id?: string;
  startTime: string;
  endTime: string;
  displayLabel: string;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    if (!startTime || !endTime || !displayLabel) {
      return { error: 'Start time, end time, and display label are required.' };
    }

    const adminSupabase = createAdminClient();

    // Generate clean slot ID if not provided
    const slotId = id?.trim() || `slot-${Date.now().toString(36)}`;

    // Check if ID already exists
    const { data: existing } = await adminSupabase
      .from('court_slots')
      .select('id')
      .eq('id', slotId)
      .maybeSingle();

    if (existing) {
      return { error: `Slot with identifier "${slotId}" already exists.` };
    }

    const { data, error } = await adminSupabase
      .from('court_slots')
      .insert({
        id: slotId,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        display_label: displayLabel.trim(),
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/courts');
    revalidatePath('/admin/settings');
    return { success: true, slot: data };
  } catch (err: any) {
    return { error: err.message || 'Failed to add court slot.' };
  }
}

/**
 * 11. Update Court Slot
 */
export async function updateCourtSlotAction({
  slotId,
  startTime,
  endTime,
  displayLabel,
}: {
  slotId: string;
  startTime: string;
  endTime: string;
  displayLabel: string;
}) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('court_slots')
      .update({
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        display_label: displayLabel.trim(),
      })
      .eq('id', slotId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/courts');
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update court slot.' };
  }
}

/**
 * 12. Delete Court Slot
 */
export async function deleteCourtSlotAction({ slotId }: { slotId: string }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();

    // Safety check: ensure no pending or confirmed reservations use this slot
    const { count: reservationCount } = await adminSupabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('slot_id', slotId)
      .in('status', ['PENDING', 'CONFIRMED']);

    if (reservationCount && reservationCount > 0) {
      return {
        error: `Cannot delete this slot: ${reservationCount} active (Pending or Confirmed) reservation(s) are booked in it. Please reschedule or cancel them first.`,
      };
    }

    const { error } = await adminSupabase.from('court_slots').delete().eq('id', slotId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/courts');
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete court slot.' };
  }
}

/**
 * 13. Delete Court
 */
export async function deleteCourtAction({ courtId }: { courtId: string }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.admin) return { error: authCheck.error };

    const adminSupabase = createAdminClient();

    // Check for active reservations
    const { count: reservationCount } = await adminSupabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('court_id', courtId)
      .in('status', ['PENDING', 'CONFIRMED']);

    if (reservationCount && reservationCount > 0) {
      return {
        error: `Cannot delete this court: ${reservationCount} active reservation(s) exist for it. Please reschedule or cancel them first.`,
      };
    }

    const { error } = await adminSupabase.from('courts').delete().eq('id', courtId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath('/admin/courts');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete court.' };
  }
}

