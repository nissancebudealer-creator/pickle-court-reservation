import { createAdminClient } from '@/lib/supabase/admin';
import { UIProperties } from '@/lib/types';
import { DEFAULT_UI_PROPERTIES } from '@/lib/ui-defaults';

export { DEFAULT_UI_PROPERTIES };

const BUCKET_NAME = 'system-config';
const FILE_NAME = 'ui_properties.json';

/**
 * Fetch UI properties from Supabase Storage with deep fallback to defaults.
 * Uses createAdminClient to avoid any cookie/session dependencies.
 */
export async function getUIProperties(): Promise<UIProperties> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.storage.from(BUCKET_NAME).download(FILE_NAME);

    if (error || !data) {
      return DEFAULT_UI_PROPERTIES;
    }

    const text = await data.text();
    const parsed = JSON.parse(text);

    return {
      departments:
        Array.isArray(parsed.departments) && parsed.departments.length > 0
          ? parsed.departments
          : DEFAULT_UI_PROPERTIES.departments,
      navigation: {
        ...DEFAULT_UI_PROPERTIES.navigation,
        ...(parsed.navigation || {}),
      },
      labels: {
        ...DEFAULT_UI_PROPERTIES.labels,
        ...(parsed.labels || {}),
      },
      custom_properties: Array.isArray(parsed.custom_properties)
        ? parsed.custom_properties
        : DEFAULT_UI_PROPERTIES.custom_properties,
    };
  } catch (err) {
    console.warn('[getUIProperties] Could not load from Supabase storage, using defaults:', err);
    return DEFAULT_UI_PROPERTIES;
  }
}

/**
 * Persist UI properties to Supabase Storage using Admin client.
 */
export async function saveUIProperties(properties: UIProperties): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      await adminSupabase.storage.createBucket(BUCKET_NAME, { public: true });
    }

    const payload = JSON.stringify(properties, null, 2);
    const { error } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, payload, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error('[saveUIProperties Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[saveUIProperties Exception]', err);
    return { success: false, error: err.message || 'Failed to save UI properties.' };
  }
}
