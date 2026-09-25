import React from 'react';
import { createClient } from '@/lib/supabase/server';
import CourtsClient from './CourtsClient';
import { Court } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCourtsPage() {
  const supabase = await createClient();

  const { data: courtsData } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  const courts: Court[] = courtsData || [];

  return <CourtsClient initialCourts={courts} />;
}
