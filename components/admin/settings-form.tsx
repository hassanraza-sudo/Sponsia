'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type WebsiteSettings } from '@/lib/types';
import { FALLBACK_SETTINGS } from '@/lib/settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PLACEHOLDER = '[Edit in Settings: ';

export function SettingsForm() {
  const [state, setState] = useState<WebsiteSettings>(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('website_settings')
      .select('data')
      .eq('id', 'general')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error('Could not load settings.');
        if (data?.data) setState({ ...FALLBACK_SETTINGS, ...(data.data as Partial<WebsiteSettings>) });
        setLoading(false);
      });
  }, []);

  function set<K extends keyof WebsiteSettings>(k: K, v: string) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    setSaving(true);
    const { error } = await createClient()
      .from('website_settings')
      .update({ data: state, updated_at: new Date().toISOString() })
      .eq('id', 'general');
    setSaving(false);
    if (error) {
      toast.error('Could not save settings. Make sure you are signed in as the administrator.');
      return;
    }
    toast.success('Settings saved — the public website now shows the new content.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  const isPlaceholder = (v: string) => v.startsWith(PLACEHOLDER);

  return (
    <Tabs defaultValue="branding">
      <TabsList className="rounded-full bg-sage/50 p-1">
        <TabsTrigger value="branding" className="rounded-full">Branding</TabsTrigger>
        <TabsTrigger value="homepage" className="rounded-full">Homepage</TabsTrigger>
        <TabsTrigger value="contact" className="rounded-full">Contact Information</TabsTrigger>
      </TabsList>

      <TabsContent value="branding" className="mt-6">
        <Card>
          <Field label="Website name" id="st-name">
            <Input id="st-name" value={state.site_name} onChange={(e) => set('site_name', e.target.value)} />
          </Field>
          <Field label="Tagline" id="st-tagline">
            <Input id="st-tagline" value={state.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="Website description (used in the footer and search results)" id="st-desc">
            <Textarea id="st-desc" rows={3} value={state.site_description} onChange={(e) => set('site_description', e.target.value)} />
          </Field>
        </Card>
      </TabsContent>

      <TabsContent value="homepage" className="mt-6">
        <Card>
          <Field label="Hero heading" id="st-hero-h">
            <Input id="st-hero-h" value={state.hero_heading} onChange={(e) => set('hero_heading', e.target.value)} />
          </Field>
          <Field label="Hero description" id="st-hero-d">
            <Textarea id="st-hero-d" rows={3} value={state.hero_description} onChange={(e) => set('hero_description', e.target.value)} />
          </Field>
          <Field label="Hero image URL (leave empty for the designed placeholder)" id="st-hero-img">
            <Input id="st-hero-img" type="url" value={state.hero_image_url} onChange={(e) => set('hero_image_url', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Mission content (optional — replaces the default mission paragraph)" id="st-mission">
            <Textarea id="st-mission" rows={4} value={state.mission_content} onChange={(e) => set('mission_content', e.target.value)} />
          </Field>
          <Field label="About content (optional)" id="st-about">
            <Textarea id="st-about" rows={4} value={state.about_content} onChange={(e) => set('about_content', e.target.value)} />
          </Field>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="mt-6">
        <Card>
          <p className="mb-6 rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
            Values shown in italics on the website are placeholders. Replace them with real details here and they
            will appear instantly on the Contact page and footer.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Official email" id="st-email">
              <Input id="st-email" type="email" className={isPlaceholder(state.contact_email) ? 'italic' : ''} value={state.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
            </Field>
            <Field label="Phone number" id="st-phone">
              <Input id="st-phone" className={isPlaceholder(state.contact_phone) ? 'italic' : ''} value={state.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
            </Field>
            <Field label="WhatsApp number" id="st-wa">
              <Input id="st-wa" className={isPlaceholder(state.contact_whatsapp) ? 'italic' : ''} value={state.contact_whatsapp} onChange={(e) => set('contact_whatsapp', e.target.value)} />
            </Field>
            <Field label="Office address" id="st-addr">
              <Input id="st-addr" className={isPlaceholder(state.office_address) ? 'italic' : ''} value={state.office_address} onChange={(e) => set('office_address', e.target.value)} />
            </Field>
            <Field label="Facebook URL" id="st-fb">
              <Input id="st-fb" type="url" value={state.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Instagram URL" id="st-ig">
              <Input id="st-ig" type="url" value={state.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="LinkedIn URL" id="st-li">
              <Input id="st-li" type="url" value={state.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/…" />
            </Field>
            <Field label="Twitter / X URL" id="st-tw">
              <Input id="st-tw" type="url" value={state.twitter_url} onChange={(e) => set('twitter_url', e.target.value)} placeholder="https://x.com/…" />
            </Field>
            <Field label="YouTube URL" id="st-yt">
              <Input id="st-yt" type="url" value={state.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} placeholder="https://youtube.com/…" />
            </Field>
          </div>
        </Card>
      </TabsContent>

      <div className="mt-8">
        <Button onClick={save} disabled={saving} className="rounded-full bg-forest px-10 py-3 text-white hover:bg-forest-deep">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>
      </div>
    </Tabs>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8">{children}</div>;
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
