import React from 'react';
import { createClient } from '@/lib/supabase/server';
import CourtsClient from './CourtsClient';
import { Court, CourtBlock } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCourtsPage() {
  const supabase = await createClient();

  const [{ data: courtsData }, { data: blocksData }] = await Promise.all([
    supabase.from('courts').select('*').order('name', { ascending: true }),
    supabase
      .from('court_blocks')
      .select('*, court:courts(*), slot:court_slots(*)')
      .order('block_date', { ascending: true }),
  ]);

  const courts: Court[] = courtsData || [];
  const blocks: CourtBlock[] = blocksData || [];

  return <CourtsClient initialCourts={courts} initialBlocks={blocks} />;
}
