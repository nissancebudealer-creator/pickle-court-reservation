import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AdminOverviewClient from './AdminOverviewClient';
import { getManilaTodayString } from '@/lib/timezone';
import { Court, CourtSlot, Profile, Reservation } from '@/lib/types';
import { addDays, parseISO } from 'date-fns';
import { formatManila } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const todayStr = getManilaTodayString();

  // 1. Fetch courts
  const { data: courtsData } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });
  const courts: Court[] = courtsData || [];

  // 2. Fetch slots
  const { data: slotsData } = await supabase
    .from('court_slots')
    .select('*')
    .order('start_time', { ascending: true });
  const slots: CourtSlot[] = slotsData || [];

  // 3. Fetch active employees
  const { data: employeesData } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'Active')
    .order('full_name', { ascending: true });
  const employees: Profile[] = employeesData || [];

  // 4. Pending reservations
  const { data: pendingData } = await supabase
    .from('reservations')
    .select('*, court:courts(*), profile:profiles(*)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });
  const pendingReservations: Reservation[] = pendingData || [];

  // 5. Today's confirmed reservations
  const { data: todayConfirmedData } = await supabase
    .from('reservations')
    .select('*, court:courts(*), profile:profiles(*)')
    .eq('status', 'CONFIRMED')
    .eq('reservation_date', todayStr)
    .order('slot_time', { ascending: true });
  const todayReservations: Reservation[] = todayConfirmedData || [];

  // 6. Upcoming confirmed reservations
  const { count: upcomingCount } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'CONFIRMED')
    .gt('reservation_date', todayStr);

  // 7. Calculate utilization for next 7 days
  const next7DaysStr = formatManila(addDays(parseISO(todayStr), 7), 'yyyy-MM-dd');
  const { count: next7DaysConfirmedCount } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'CONFIRMED')
    .gte('reservation_date', todayStr)
    .lte('reservation_date', next7DaysStr);

  const activeCourtsCount = courts.filter((c) => c.status === 'ACTIVE').length;
  const totalCapacityNext7Days = Math.max(1, activeCourtsCount * (slots.length || 3) * 7);
  const utilizationPercent = Math.min(
    100,
    Math.round(((next7DaysConfirmedCount || 0) / totalCapacityNext7Days) * 100)
  );

  const metrics = {
    needsApproval: pendingReservations.length,
    todayConfirmed: todayReservations.length,
    upcomingConfirmed: upcomingCount || 0,
    utilizationPercent,
    activeCourtsCount,
  };

  return (
    <AdminOverviewClient
      metrics={metrics}
      pendingReservations={pendingReservations}
      todayReservations={todayReservations}
      courts={courts}
      slots={slots}
      employees={employees}
    />
  );
}
