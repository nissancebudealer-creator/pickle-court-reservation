import React from 'react';
import { createClient } from '@/lib/supabase/server';
import EmployeesClient from './EmployeesClient';
import { Profile } from '@/lib/types';
import { getUIProperties } from '@/lib/ui-properties';

export const dynamic = 'force-dynamic';

export default async function AdminEmployeesPage() {
  const supabase = await createClient();

  const [
    { data: employeesData },
    { data: { user } },
    uiProperties,
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.auth.getUser(),
    getUIProperties(),
  ]);

  const employees: Profile[] = employeesData || [];

  return (
    <EmployeesClient
      initialEmployees={employees}
      configuredDepartments={uiProperties.departments}
      currentUserId={user?.id}
    />
  );
}
