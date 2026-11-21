import { createPublicClient } from '@/lib/supabase/public';
import type { WebsiteSettings } from '@/lib/types';

export const FALLBACK_SETTINGS: WebsiteSettings = {
  site_name: 'Sponsia',
  tagline: 'Every Student Deserves a Chance.',
  site_description:
    'We connect financially struggling students with individuals, donors and organisations who believe that every child deserves access to education.',
  hero_heading: 'Every Student Deserves a Chance.',
  hero_description:
    'Financial difficulties should never decide a child’s future. Sponsia connects students who need educational support with people who believe in the power of education.',
  hero_image_url: '',
  mission_content: '',
  about_content: '',
  contact_email: '[Edit in Settings: official email]',
  contact_phone: '[Edit in Settings: phone number]',
  contact_whatsapp: '[Edit in Settings: WhatsApp number]',
  office_address: '[Edit in Settings: office address]',
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  twitter_url: '',
  youtube_url: '',
};

export async function getSettings(): Promise<WebsiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('website_settings')
      .select('data')
      .eq('id', 'general')
      .maybeSingle();
    if (error || !data?.data) return FALLBACK_SETTINGS;
    return { ...FALLBACK_SETTINGS, ...(data.data as Partial<WebsiteSettings>) };
  } catch {
    return FALLBACK_SETTINGS;
  }
}
