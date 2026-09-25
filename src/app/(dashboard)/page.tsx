import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { getManilaTodayString } from '@/lib/timezone';
import { Court, CourtSlot, Profile, Reservation, CourtBlock, SystemSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // 2. Fetch courts
  const { data: courtsData } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  const courts: Court[] = courtsData || [];

  // 3. Fetch court slots
  const { data: slotsData } = await supabase
    .from('court_slots')
    .select('*')
    .order('start_time', { ascending: true });

  const slots: CourtSlot[] = slotsData || [];

  const todayStr = getManilaTodayString();

  // 4. Fetch upcoming reservations
  const { data: reservationsData } = await supabase
    .from('reservations')
    .select('*, profile:profiles(*)')
    .gte('reservation_date', todayStr)
    .in('status', ['PENDING', 'CONFIRMED'])
    .order('created_at', { ascending: false });

  const reservations: Reservation[] = reservationsData || [];

  // 5. Fetch court blocks
  const { data: blocksData } = await supabase
    .from('court_blocks')
    .select('*')
    .gte('block_date', todayStr);

  const blocks: CourtBlock[] = blocksData || [];

  // 6. Fetch system settings
  const { data: settingsData } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const settings: SystemSettings = settingsData || {
    id: 1,
    company_name: 'COMPANY',
    court_brand: 'PICKLEBALL',
    company_logo_url: null,
    max_advance_days: 7,
    max_active_reservations_per_employee: 1,
    updated_at: new Date().toISOString(),
  };

  // 7. Check user's active bookings
  const userActiveReservations = reservations.filter(
    (r) =>
      r.user_id === user.id &&
      (r.status === 'PENDING' || r.status === 'CONFIRMED') &&
      r.reservation_date >= todayStr
  );

  return (
    <DashboardClient
      user={profile}
      courts={courts}
      slots={slots}
      reservations={reservations}
      blocks={blocks}
      settings={settings}
      userActiveReservations={userActiveReservations}
    />
  );
}
