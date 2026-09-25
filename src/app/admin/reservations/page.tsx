import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ReservationsClient from './ReservationsClient';
import { Reservation, Court, CourtSlot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminReservationsPage() {
  const supabase = await createClient();

  // 1. Fetch all reservations
  const { data: reservationsData } = await supabase
    .from('reservations')
    .select('*, court:courts(*), profile:profiles(*)')
    .order('reservation_date', { ascending: false })
    .order('created_at', { ascending: false });

  const reservations: Reservation[] = reservationsData || [];

  // 2. Fetch courts
  const { data: courtsData } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  const courts: Court[] = courtsData || [];

  // 3. Fetch slots
  const { data: slotsData } = await supabase
    .from('court_slots')
    .select('*')
    .order('start_time', { ascending: true });

  const slots: CourtSlot[] = slotsData || [];

  return (
    <ReservationsClient
      initialReservations={reservations}
      courts={courts}
      slots={slots}
    />
  );
}
