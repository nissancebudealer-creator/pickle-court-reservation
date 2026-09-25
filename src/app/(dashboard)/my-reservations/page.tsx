import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MyReservationsClient from './MyReservationsClient';
import { Reservation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MyReservationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/my-reservations');
  }

  // Fetch all user reservations
  const { data: reservationsData } = await supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('user_id', user.id)
    .order('reservation_date', { ascending: false })
    .order('created_at', { ascending: false });

  const reservations: Reservation[] = reservationsData || [];

  return <MyReservationsClient reservations={reservations} />;
}
