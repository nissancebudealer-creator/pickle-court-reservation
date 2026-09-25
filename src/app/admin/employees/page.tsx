import React from 'react';
import { createClient } from '@/lib/supabase/server';
import EmployeesClient from './EmployeesClient';
import { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminEmployeesPage() {
  const supabase = await createClient();

  const { data: employeesData } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  const employees: Profile[] = employeesData || [];

  return <EmployeesClient initialEmployees={employees} />;
}
