import React from 'react';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './SettingsClient';
import { SystemSettings, CourtSlot } from '@/lib/types';
import { getUIProperties } from '@/lib/ui-properties';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const [{ data: settingsData }, { data: slotsData }, uiProperties] = await Promise.all([
    supabase.from('system_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('court_slots').select('*').order('start_time', { ascending: true }),
    getUIProperties(),
  ]);

  const settings: SystemSettings = settingsData || {
    id: 1,
    company_name: 'COMPANY',
    court_brand: 'PICKLEBALL',
    company_logo_url: null,
    max_advance_days: 7,
    max_active_reservations_per_employee: 1,
    updated_at: new Date().toISOString(),
  };

  const slots: CourtSlot[] = slotsData || [];

  return (
    <SettingsClient
      initialSettings={settings}
      initialUIProperties={uiProperties}
      initialSlots={slots}
    />
  );
}

