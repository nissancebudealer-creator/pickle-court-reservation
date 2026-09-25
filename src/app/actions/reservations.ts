'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { generateReservationId, getManilaTodayString, isSlotPast } from '@/lib/timezone';
import {
  sendRequestSubmittedNotice,
  sendAdminNewRequestNotice,
  sendApprovalNotice,
  sendAutoRejectionNotice,
  sendCancellationNotice,
  sendRescheduleNotice,
} from '@/lib/email';
import { Reservation } from '@/lib/types';

/**
 * Helper to get current authenticated user and profile
 */
async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, error: 'Unauthorized. Please sign in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'Deactivated') {
    return { user, profile: null, error: 'Account is inactive or deactivated.' };
  }

  return { user, profile, error: null };
}

/**
 * 1. Create a reservation request (Employee or Admin)
 */
export async function createReservationRequest({
  courtId,
  date,
  slotId,
  teammates,
}: {
  courtId: string;
  date: string;
  slotId: string;
  teammates: string;
}) {
  try {
    const { user, profile, error: authError } = await getCurrentUserAndProfile();
    if (authError || !user || !profile) {
      return { error: authError || 'Authentication required' };
    }

    if (!teammates || teammates.trim().length === 0) {
      return { error: 'Please list your teammates or co-players for this reservation.' };
    }

    const supabase = await createClient();
    const todayStr = getManilaTodayString();

    // 1. Validate court
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (courtError || !court || court.status !== 'ACTIVE') {
      return { error: 'Selected court is currently inactive or under maintenance.' };
    }

    // 2. Validate slot
    const { data: slot, error: slotError } = await supabase
      .from('court_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return { error: 'Invalid time slot.' };
    }

    // Check if slot has already passed
    if (isSlotPast(date, slot.end_time)) {
      return { error: 'This time slot has already passed.' };
    }

    // 3. Check blocked slots/dates
    const { data: blocks } = await supabase
      .from('court_blocks')
      .select('*')
      .eq('block_date', date);

    if (blocks && blocks.length > 0) {
      const isBlocked = blocks.some(
        (b) =>
          (!b.court_id || b.court_id === courtId) &&
          (!b.slot_id || b.slot_id === slotId)
      );
      if (isBlocked) {
        return { error: 'This court or time slot is blocked for maintenance or private facility event.' };
      }
    }

    // 4. Check if slot already has a CONFIRMED booking
    const { data: confirmedBooking } = await supabase
      .from('reservations')
      .select('id')
      .eq('court_id', courtId)
      .eq('reservation_date', date)
      .eq('slot_id', slotId)
      .eq('status', 'CONFIRMED')
      .maybeSingle();

    if (confirmedBooking) {
      return { error: 'This slot has already been confirmed for another party.' };
    }

    // 5. Policy Enforcement: Check if non-admin user already has an active booking
    if (profile.role !== 'admin') {
      const { count: activeCount } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['PENDING', 'CONFIRMED'])
        .gte('reservation_date', todayStr);

      if (activeCount && activeCount >= 1) {
        return {
          error:
            'Policy Notice: You already have an active (Pending or Confirmed) court booking. Corporate guidelines permit 1 active booking per employee.',
        };
      }
    }

    // 6. Generate reservation ticket ID and insert
    const reservationId = generateReservationId(date);
    const { data: newReservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        id: reservationId,
        court_id: courtId,
        user_id: user.id,
        reservation_date: date,
        slot_id: slotId,
        slot_time: slot.display_label,
        teammates: teammates.trim(),
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Create Reservation Error]', insertError);
      return { error: insertError.message || 'Failed to submit reservation request.' };
    }

    // 7. Fire notification emails asynchronously
    sendRequestSubmittedNotice({
      employeeEmail: profile.email,
      employeeName: profile.full_name,
      reservationId,
      courtName: court.name,
      reservationDate: date,
      slotTime: slot.display_label,
      teammates: teammates.trim(),
    }).catch(console.error);

    sendAdminNewRequestNotice({
      employeeName: profile.full_name,
      employeeEmail: profile.email,
      department: profile.department,
      reservationId,
      courtName: court.name,
      reservationDate: date,
      slotTime: slot.display_label,
      teammates: teammates.trim(),
    }).catch(console.error);

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');

    return { success: true, reservationId };
  } catch (err: any) {
    console.error('[createReservationRequest Exception]', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * 2. Withdraw or Cancel a reservation (Employee or Admin)
 */
export async function cancelReservationAction({
  reservationId,
  reason,
}: {
  reservationId: string;
  reason?: string;
}) {
  try {
    const { user, profile, error: authError } = await getCurrentUserAndProfile();
    if (authError || !user || !profile) {
      return { error: authError || 'Unauthorized' };
    }

    const supabase = await createClient();

    // Fetch existing reservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*, court:courts(*), profile:profiles(*)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found.' };
    }

    const isAdmin = profile.role === 'admin';
    const isOwner = reservation.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return { error: 'You are not authorized to cancel this reservation.' };
    }

    if (reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED') {
      return { error: `Reservation is already ${reservation.status.toLowerCase()}.` };
    }

    const cancelledBy = isAdmin && !isOwner ? 'Facilities Admin' : 'Employee';

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'CANCELLED',
        cancelled_by: cancelledBy,
        rejection_reason: reason || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Send cancellation notice to employee
    if (reservation.profile?.email) {
      sendCancellationNotice({
        employeeEmail: reservation.profile.email,
        employeeName: reservation.profile.full_name,
        reservationId: reservation.id,
        courtName: reservation.court?.name || 'Pickleball Court',
        reservationDate: reservation.reservation_date,
        slotTime: reservation.slot_time,
        cancelledBy,
        reason,
      }).catch(console.error);
    }

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to cancel reservation.' };
  }
}

/**
 * 3. Approve a reservation (Admin only)
 */
export async function approveReservationAction({ reservationId }: { reservationId: string }) {
  try {
    const { profile, error: authError } = await getCurrentUserAndProfile();
    if (authError || !profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required.' };
    }

    const adminSupabase = createAdminClient();

    // Fetch target reservation with details
    const { data: reservation, error: fetchError } = await adminSupabase
      .from('reservations')
      .select('*, court:courts(*), profile:profiles(*)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found.' };
    }

    if (reservation.status !== 'PENDING') {
      return { error: `Cannot approve reservation with status: ${reservation.status}` };
    }

    // Check if slot has already been confirmed
    const { data: existingConfirmed } = await adminSupabase
      .from('reservations')
      .select('id')
      .eq('court_id', reservation.court_id)
      .eq('reservation_date', reservation.reservation_date)
      .eq('slot_id', reservation.slot_id)
      .eq('status', 'CONFIRMED')
      .maybeSingle();

    if (existingConfirmed) {
      return { error: 'Another reservation for this court slot is already confirmed.' };
    }

    // Find conflicting pending reservations to notify them
    const { data: conflictingPending } = await adminSupabase
      .from('reservations')
      .select('*, profile:profiles(*)')
      .eq('court_id', reservation.court_id)
      .eq('reservation_date', reservation.reservation_date)
      .eq('slot_id', reservation.slot_id)
      .eq('status', 'PENDING')
      .neq('id', reservationId);

    // 1. Confirm target reservation
    const { error: approveError } = await adminSupabase
      .from('reservations')
      .update({
        status: 'CONFIRMED',
        approved_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (approveError) {
      return { error: approveError.message };
    }

    // 2. Reject conflicting pending reservations (database trigger also handles this, but we do explicit email notifications)
    if (conflictingPending && conflictingPending.length > 0) {
      await adminSupabase
        .from('reservations')
        .update({
          status: 'REJECTED',
          rejection_reason: 'Slot granted to another applicant',
          cancelled_at: new Date().toISOString(),
        })
        .in(
          'id',
          conflictingPending.map((c) => c.id)
        );

      // Email rejected applicants
      for (const rejected of conflictingPending) {
        if (rejected.profile?.email) {
          sendAutoRejectionNotice({
            employeeEmail: rejected.profile.email,
            employeeName: rejected.profile.full_name,
            reservationId: rejected.id,
            courtName: reservation.court?.name || 'Pickleball Court',
            reservationDate: reservation.reservation_date,
            slotTime: reservation.slot_time,
          }).catch(console.error);
        }
      }
    }

    // 3. Email approved applicant
    if (reservation.profile?.email) {
      sendApprovalNotice({
        employeeEmail: reservation.profile.email,
        employeeName: reservation.profile.full_name,
        reservationId: reservation.id,
        courtName: reservation.court?.name || 'Pickleball Court',
        courtLocation: reservation.court?.location || 'Sports Annex',
        reservationDate: reservation.reservation_date,
        slotTime: reservation.slot_time,
        teammates: reservation.teammates,
      }).catch(console.error);
    }

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');

    return { success: true };
  } catch (err: any) {
    console.error('[approveReservationAction Exception]', err);
    return { error: err.message || 'Failed to approve reservation.' };
  }
}

/**
 * 4. Reject a reservation (Admin only)
 */
export async function rejectReservationAction({
  reservationId,
  reason,
}: {
  reservationId: string;
  reason: string;
}) {
  try {
    const { profile, error: authError } = await getCurrentUserAndProfile();
    if (authError || !profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required.' };
    }

    const adminSupabase = createAdminClient();

    const { data: reservation, error: fetchError } = await adminSupabase
      .from('reservations')
      .select('*, court:courts(*), profile:profiles(*)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found.' };
    }

    const { error: rejectError } = await adminSupabase
      .from('reservations')
      .update({
        status: 'REJECTED',
        rejection_reason: reason || 'Declined by Facilities Administration',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (rejectError) {
      return { error: rejectError.message };
    }

    if (reservation.profile?.email) {
      sendCancellationNotice({
        employeeEmail: reservation.profile.email,
        employeeName: reservation.profile.full_name,
        reservationId: reservation.id,
        courtName: reservation.court?.name || 'Pickleball Court',
        reservationDate: reservation.reservation_date,
        slotTime: reservation.slot_time,
        cancelledBy: 'Facilities Administration',
        reason: reason || 'Declined by administrator',
      }).catch(console.error);
    }

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to reject reservation.' };
  }
}

/**
 * 5. Reschedule a reservation (Admin only)
 */
export async function rescheduleReservationAction({
  reservationId,
  newCourtId,
  newDate,
  newSlotId,
}: {
  reservationId: string;
  newCourtId: string;
  newDate: string;
  newSlotId: string;
}) {
  try {
    const { profile, error: authError } = await getCurrentUserAndProfile();
    if (authError || !profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required.' };
    }

    const adminSupabase = createAdminClient();

    // Fetch existing reservation
    const { data: reservation, error: fetchError } = await adminSupabase
      .from('reservations')
      .select('*, court:courts(*), profile:profiles(*)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found.' };
    }

    // Fetch new court
    const { data: newCourt, error: courtError } = await adminSupabase
      .from('courts')
      .select('*')
      .eq('id', newCourtId)
      .single();

    if (courtError || !newCourt || newCourt.status !== 'ACTIVE') {
      return { error: 'Selected destination court is not active.' };
    }

    // Fetch new slot
    const { data: newSlot, error: slotError } = await adminSupabase
      .from('court_slots')
      .select('*')
      .eq('id', newSlotId)
      .single();

    if (slotError || !newSlot) {
      return { error: 'Invalid destination slot.' };
    }

    // Check if new slot already confirmed
    const { data: existingConfirmed } = await adminSupabase
      .from('reservations')
      .select('id')
      .eq('court_id', newCourtId)
      .eq('reservation_date', newDate)
      .eq('slot_id', newSlotId)
      .eq('status', 'CONFIRMED')
      .neq('id', reservationId)
      .maybeSingle();

    if (existingConfirmed) {
      return { error: 'Destination court and time slot is already confirmed for another booking.' };
    }

    // Update reservation
    const { error: updateError } = await adminSupabase
      .from('reservations')
      .update({
        court_id: newCourtId,
        reservation_date: newDate,
        slot_id: newSlotId,
        slot_time: newSlot.display_label,
      })
      .eq('id', reservationId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Notify employee of reschedule
    if (reservation.profile?.email) {
      sendRescheduleNotice({
        employeeEmail: reservation.profile.email,
        employeeName: reservation.profile.full_name,
        reservationId: reservation.id,
        oldCourtName: reservation.court?.name || 'Original Court',
        oldReservationDate: reservation.reservation_date,
        oldSlotTime: reservation.slot_time,
        newCourtName: newCourt.name,
        newReservationDate: newDate,
        newSlotTime: newSlot.display_label,
      }).catch(console.error);
    }

    revalidatePath('/dashboard');
    revalidatePath('/my-reservations');
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to reschedule reservation.' };
  }
}
