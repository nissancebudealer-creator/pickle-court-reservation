'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error('Login action error:', err);
    return { error: err?.message || 'Login failed. Please check credentials.' };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const department = formData.get('department') as string;
    const managerName = formData.get('managerName') as string;
    const mobileNumber = formData.get('mobileNumber') as string;

    if (!fullName || !email || !password || !department || !managerName || !mobileNumber) {
      return { error: 'All fields are required for corporate employee registration.' };
    }

    if (fullName.trim().length < 2) {
      return { error: 'Full name must be at least 2 characters.' };
    }

    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters long.' };
    }

    // Validate Philippine mobile number format: +63XXXXXXXXXX or 09XXXXXXXXX
    const mobileRegex = /^(\+639|09)\d{9}$/;
    if (!mobileRegex.test(mobileNumber.trim().replace(/\s/g, ''))) {
      return {
        error:
          'Invalid mobile number. Use a Philippine format: 09XXXXXXXXX or +639XXXXXXXXX.',
      };
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
  } catch (err: any) {
    console.error('Register action error:', err);
    return { error: err?.message || 'Registration failed.' };
  }
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }
  redirect('/login');
}
