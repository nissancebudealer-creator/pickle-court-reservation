'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if profile is deactivated
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.status === 'Deactivated') {
      await supabase.auth.signOut();
      return { error: 'Your employee account has been deactivated. Please contact Facilities & HR.' };
    }
  }

  return { success: true, redirectTo };
}

export async function registerAction(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const department = formData.get('department') as string;
  const managerName = formData.get('managerName') as string;
  const mobileNumber = formData.get('mobileNumber') as string;

  if (!fullName || !email || !password || !department || !managerName || !mobileNumber) {
    return { error: 'All fields are required for corporate employee registration.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        department: department.trim(),
        manager_name: managerName.trim(),
        mobile_number: mobileNumber.trim(),
        role: 'employee',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Also ensure profile exists in public.profiles in case trigger has delay
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      department: department.trim(),
      manager_name: managerName.trim(),
      mobile_number: mobileNumber.trim(),
      role: 'employee',
      status: 'Active',
    });
  }

  return { success: true, user: data.user };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
