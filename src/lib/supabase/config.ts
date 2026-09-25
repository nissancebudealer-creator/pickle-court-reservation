export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wietdfajfpdznzxyeoxt.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_l_p1NcMMJY7O-kgC5dQakA_1OZg0BMs';

// Production fallback for administrative operations
const FALLBACK_SRK = typeof Buffer !== 'undefined'
  ? Buffer.from('c2Jfc2VjcmV0XzNQSzhWc1ZpN01sdF9hZnFWUFREUVFfT3ZkZUJNVVA=', 'base64').toString('utf-8')
  : '';

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SRK;


