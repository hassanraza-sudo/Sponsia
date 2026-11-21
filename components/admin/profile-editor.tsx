'use client';

import { useEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft, Upload, Trash2, Save, Eye, Globe2, Lock, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  type StudentApplication, type StudentConsents, type StudentPublicProfile,
  type DisplayMode, type SupportCategory, educationLevelLabel, formatPKR,
  EDUCATION_LEVELS, SUPPORT_CATEGORIES,
} from '@/lib/types';
import { STATUS_LABEL } from '@/lib/form-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface EditorState {
  display_mode: DisplayMode;
  display_name: string;
  education_level: string;
  support_category: SupportCategory;
  current_grade: string;
  school_name: string;
  city: string;
  district: string;
  story: string;
  goal: string;
  background: string;
  support_requirement: string;
  estimated_amount_pkr: string;
  achievements: string;
  photo_public: boolean;
  show_education_level: boolean;
  show_grade: boolean;
  show_school: boolean;
  show_city: boolean;
  show_district: boolean;
  show_story: boolean;
  show_goal: boolean;
  show_background: boolean;
  show_support: boolean;
  show_amount: boolean;
  show_achievements: boolean;
}

const MAX_PHOTO_MB = 5;
const ACCEPTED_PHOTO = ['image/jpeg', 'image/png', 'image/webp'];

function seedProfile(app: StudentApplication, code: string): EditorState {
  return {
    display_mode: 'anonymous',
    display_name: '',
    education_level: app.education_level,
    support_category: 'general',
    current_grade: app.current_grade ?? '',
    school_name: app.institution_name ?? '',
    city: app.city,
    district: app.district,
    story: app.support_reason ?? '',
    goal: app.educational_goal ?? '',
    background: app.academic_performance
      ? `Academic performance: ${app.academic_performance}. Currently studying in ${app.current_grade} at ${app.institution_name}.`
      : '',
    support_requirement: app.expenses_monthly
      ? `Estimated educational expenses of ${formatPKR(app.expenses_monthly)} per month.`
      : '',
    estimated_amount_pkr: app.expenses_monthly ? String(app.expenses_monthly) : '',
    achievements: '',
    photo_public: false,
    show_education_level: true,
    show_grade: false,
    show_school: false,
    show_city: false,
    show_district: false,
    show_story: true,
    show_goal: true,
    show_background: false,
    show_support: true,
    show_amount: false,
    show_achievements: false,
  };
}

function toEditor(p: StudentPublicProfile): EditorState {
  return {
    display_mode: p.display_mode,
    display_name: p.display_name ?? '',
    education_level: p.education_level,
    support_category: p.support_category,
    current_grade: p.current_grade ?? '',
    school_name: p.school_name ?? '',
    city: p.city ?? '',
    district: p.district ?? '',
    story: p.story ?? '',
    goal: p.goal ?? '',
    background: p.background ?? '',
    support_requirement: p.support_requirement ?? '',
    estimated_amount_pkr: p.estimated_amount_pkr != null ? String(p.estimated_amount_pkr) : '',
    achievements: p.achievements ?? '',
    photo_public: p.photo_public,
    show_education_level: p.show_education_level,
    show_grade: p.show_grade,
    show_school: p.show_school,
    show_city: p.show_city,
    show_district: p.show_district,
    show_story: p.show_story,
    show_goal: p.show_goal,
    show_background: p.show_background,
    show_support: p.show_support,
    show_amount: p.show_amount,
    show_achievements: p.show_achievements,
  };
}

export function ProfileEditor({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [app, setApp] = useState<StudentApplication | null>(null);
  const [consents, setConsents] = useState<StudentConsents | null>(null);
  const [profile, setProfile] = useState<StudentPublicProfile | null>(null);
  const [state, setState] = useState<EditorState | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoRemovalPending, setPhotoRemovalPending] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const pendingPhotoPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: a }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('student_applications').select('*').eq('id', applicationId).maybeSingle(),
        supabase.from('student_consents').select('*').eq('application_id', applicationId).maybeSingle(),
        supabase.from('student_public_profiles').select('*').eq('application_id', applicationId).maybeSingle(),
      ]);
      if (!a) { setLoading(false); return; }
      setApp(a);
      setConsents(c);
      if (p) {
        setProfile(p);
        setState(toEditor(p));
        setPhotoPath(p.photo_path);
      } else {
        setState(seedProfile(a, a.application_code));
      }
      setLoading(false);
    })();
  }, [applicationId]);

  useEffect(() => {
    let cancelled = false;
    if (!photoPath) {
      setPhotoUrl(null);
      return;
    }

    void (async () => {
      try {
        const { data, error } = await createClient()
          .storage.from('public-profiles').createSignedUrl(photoPath, 60);
        if (error) throw error;
        if (!cancelled) setPhotoUrl(data.signedUrl);
      } catch (error) {
        console.error('Could not create a signed profile-photo URL.', error);
        if (!cancelled) setPhotoUrl(null);
      }
    })();

    return () => { cancelled = true; };
  }, [photoPath]);

  const can = useMemo(() => ({
    name: consents?.consent_name === true,
    photo: consents?.consent_photo === true,
    story: consents?.consent_story === true,
    school: consents?.consent_school === true,
    location: consents?.consent_location === true,
  }), [consents]);

  function set<K extends keyof EditorState>(k: K, v: EditorState[K]) {
    setState((s) => (s ? { ...s, [k]: v } : s));
  }

  async function cleanupPhotoPaths(paths: string[]): Promise<string[]> {
    const failedPaths: string[] = [];
    const supabase = createClient();

    for (const path of Array.from(new Set(paths))) {
      try {
        const { data: references, error: referenceError } = await supabase
          .from('student_public_profiles')
          .select('id')
          .eq('photo_path', path)
          .limit(1);
        if (referenceError) throw referenceError;
        if (references?.length) continue;

        const { error: removeError } = await supabase.storage
          .from('public-profiles')
          .remove([path]);
        if (removeError) throw removeError;
      } catch (error) {
        console.error(`Could not safely remove profile photo ${path}.`, error);
        failedPaths.push(path);
      }
    }

    return failedPaths;
  }

  async function handlePhotoSaveFailure(message: string) {
    const failedPaths = await cleanupPhotoPaths(Array.from(pendingPhotoPaths.current));
    pendingPhotoPaths.current = new Set(failedPaths);
    setPhotoPath(profile?.photo_path ?? null);
    set('photo_public', profile?.photo_public ?? false);
    setPhotoRemovalPending(false);
    toast.error(failedPaths.length
      ? `${message} The existing photo was preserved, but an unused replacement photo could not be removed.`
      : `${message} The existing photo was preserved.`);
  }

  function displayNameLabel(mode: DisplayMode): string {
    switch (mode) {
      case 'full_name': return can.name ? 'Student’s full name' : 'Student’s full name (no consent)';
      case 'first_name': return can.name ? 'First name only' : 'First name only (no consent)';
      case 'alias': return 'A chosen public alias';
      case 'anonymous': return 'Anonymous — “Student TD-XXXX”';
    }
  }

  async function uploadPhoto(file: File) {
    if (!app) return;
    if (!ACCEPTED_PHOTO.includes(file.type)) return toast.error('Photo must be JPG, PNG or WEBP.');
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) return toast.error(`Photo must be under ${MAX_PHOTO_MB} MB.`);
    if (!can.photo) return toast.error('The student has not consented to a public photograph.');

    setPhotoUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `profiles/${app.application_code}-${Date.now()}.${ext}`;
    pendingPhotoPaths.current.add(path);
    try {
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from('public-profiles').upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (upErr) throw upErr;
      setPhotoPath(path);
      setPhotoRemovalPending(false);
      set('photo_public', true);
      toast.success('Photo uploaded. Remember to save.');
    } catch (err) {
      console.error('Could not upload the profile photo.', err);
      const failedCleanupPaths = await cleanupPhotoPaths([path]);
      if (!failedCleanupPaths.includes(path)) pendingPhotoPaths.current.delete(path);
      toast.error(failedCleanupPaths.includes(path)
        ? 'Photo upload failed, and its temporary file could not be cleaned up. Please contact an administrator.'
        : 'Photo upload failed. The existing photo was kept.');
    } finally {
      setPhotoUploading(false);
    }
  }

  function removePhoto() {
    if (!photoPath) return;
    setPhotoPath(null);
    setPhotoRemovalPending(true);
    set('photo_public', false);
    toast.success('Photo removal queued. Save the profile to apply it.');
  }

  async function save(publication_status?: 'published'): Promise<StudentPublicProfile | null> {
    if (!app || !state) return null;
    if (photoUploading) {
      toast.error('Wait for the photo upload to finish before saving.');
      return null;
    }
    if (app.status !== 'approved') {
      toast.error('Public profiles can only be prepared for approved applications.');
      return null;
    }

    if (!can.name && state.display_mode !== 'anonymous') {
      toast.error('The student did not consent to their real name being shown. Use an alias or anonymous mode.');
      return null;
    }
    if (publication_status === 'published') {
      if (!can.story && !can.name && !can.photo) {
        toast.error('This student declined all public display options, so the profile cannot be published.');
        return null;
      }
      const dob = app.date_of_birth ? new Date(`${app.date_of_birth}T00:00:00`) : null;
      const today = new Date();
      const age = dob && !Number.isNaN(dob.getTime())
        ? today.getFullYear() - dob.getFullYear()
          - (today.getMonth() < dob.getMonth()
            || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0)
        : null;
      if ((age == null || dob! > today || age < 18) && consents?.guardian_consent !== true) {
        toast.error('Guardian consent is required when the date of birth is missing, invalid, or under 18.');
        return null;
      }
    }
    if (state.display_mode === 'alias' && !state.display_name.trim()) {
      toast.error('Enter the public alias to display, or choose another identity mode.');
      return null;
    }

    const supabase = createClient();
    let currentApplication: { status: StudentApplication['status'] } | null;
    try {
      const { data, error: statusError } = await supabase
        .from('student_applications')
        .select('status')
        .eq('id', app.id)
        .maybeSingle();
      if (statusError) {
        console.error('Could not verify the application status before saving its profile.', statusError);
        await handlePhotoSaveFailure('Could not verify that the application is approved, so the profile was not saved.');
        return null;
      }
      currentApplication = data;
    } catch (error) {
      console.error('Could not verify the application status before saving its profile.', error);
      await handlePhotoSaveFailure('Could not verify that the application is approved, so the profile was not saved.');
      return null;
    }
    if (currentApplication?.status !== 'approved') {
      if (currentApplication) setApp({ ...app, status: currentApplication.status });
      await handlePhotoSaveFailure('Only approved applications can have a public profile.');
      return null;
    }

    const previousPhotoPath = profile?.photo_path ?? null;
    const nextPhotoPath = photoRemovalPending ? null : photoPath;
    const row = {
      application_id: app.id,
      public_code: app.application_code,
      display_mode: state.display_mode,
      display_name: state.display_mode === 'anonymous' ? null : state.display_name.trim() || null,
      education_level: state.education_level,
      support_category: state.support_category,
      current_grade: state.current_grade,
      school_name: state.school_name,
      city: state.city,
      district: state.district,
      story: state.story,
      goal: state.goal,
      background: state.background,
      support_requirement: state.support_requirement,
      estimated_amount_pkr: state.estimated_amount_pkr === '' ? null : Number(state.estimated_amount_pkr),
      achievements: state.achievements,
      photo_path: nextPhotoPath,
      photo_public: can.photo && state.photo_public && !!nextPhotoPath,
      show_education_level: can.story && state.show_education_level,
      show_grade: can.story && state.show_grade,
      show_school: can.school && state.show_school,
      show_city: can.location && state.show_city,
      show_district: can.location && state.show_district,
      show_story: can.story && state.show_story,
      show_goal: can.story && state.show_goal,
      show_background: can.story && state.show_background,
      show_support: can.story && state.show_support,
      show_amount: can.story && state.show_amount,
      show_achievements: can.story && state.show_achievements,
      ...(publication_status
        ? { publication_status, published_at: new Date().toISOString() }
        : {}),
    };

    let savedProfile: StudentPublicProfile;
    try {
      const result = profile
        ? await supabase.from('student_public_profiles').update(row).eq('id', profile.id).select().single()
        : await supabase.from('student_public_profiles').insert(row).select().single();
      if (result.error) {
        const message = result.error.message.includes('Guardian consent')
          ? 'Guardian consent is required before publishing a minor’s profile.'
          : 'Could not save the profile.';
        await handlePhotoSaveFailure(message);
        return null;
      }
      savedProfile = result.data;
    } catch (error) {
      console.error('Could not save the student public profile.', error);
      await handlePhotoSaveFailure('Could not save the profile.');
      return null;
    }

    setProfile(savedProfile);
    setState(toEditor(savedProfile));
    setPhotoPath(savedProfile.photo_path);
    setPhotoRemovalPending(false);

    const pathsToClean = Array.from(pendingPhotoPaths.current)
      .filter((path) => path !== savedProfile.photo_path);
    if (previousPhotoPath && previousPhotoPath !== savedProfile.photo_path) {
      pathsToClean.push(previousPhotoPath);
    }
    const failedCleanupPaths = await cleanupPhotoPaths(pathsToClean);
    pendingPhotoPaths.current = new Set(
      failedCleanupPaths.filter((path) => path !== savedProfile.photo_path)
    );
    if (failedCleanupPaths.length) {
      toast.error('Profile saved, but an old photo could not be removed from storage. Please contact an administrator.');
    }
    return savedProfile;
  }

  async function handleSaveDraft() {
    setSaving(true);
    const saved = await save();
    setSaving(false);
    if (saved) {
      toast.success('Draft saved. It is not visible to the public yet.');
      router.refresh();
    }
  }

  async function handlePublish() {
    setPublishing(true);
    const saved = await save('published');
    setPublishing(false);
    if (saved) {
      toast.success('Profile published! It is now live on the website.');
      router.refresh();
    }
  }

  async function handleUnpublish() {
    if (!profile) return;
    setPublishing(true);
    const { error } = await createClient()
      .from('student_public_profiles')
      .update({ publication_status: 'draft', published_at: null })
      .eq('id', profile.id);
    setPublishing(false);
    if (error) return toast.error('Could not unpublish.');
    setProfile({ ...profile, publication_status: 'draft' });
    toast.success('Profile unpublished. It is no longer visible on the website.');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!app || !state) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="font-medium text-charcoal">Application not found.</p>
        <Link href="/admin/applications" className="mt-4 inline-block font-semibold text-forest hover:underline">
          ← Back to all applications
        </Link>
      </div>
    );
  }

  if (app.status !== 'approved') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <p className="font-medium text-amber-900">Public profile preparation is unavailable.</p>
        <p className="mt-2 text-sm text-amber-800">
          This application is {STATUS_LABEL[app.status]}. An admin must approve it before a public profile can be
          prepared. Its status will not be changed automatically.
        </p>
        <Link href={`/admin/applications/${app.id}`} className="mt-4 inline-block font-semibold text-forest hover:underline">
          ← Back to application
        </Link>
      </div>
    );
  }

  const isPublished = profile?.publication_status === 'published';
  const previewName =
    state.display_mode === 'anonymous'
      ? `Student ${app.application_code}`
      : state.display_mode === 'first_name'
        ? (state.display_name || app.full_name).split(' ')[0]
        : state.display_mode === 'alias'
          ? state.display_name || `Student ${app.application_code}`
          : state.display_name || app.full_name;

  const switches: { key: keyof EditorState; label: string; locked?: boolean }[] = [
    { key: 'photo_public', label: 'Photograph', locked: !can.photo || !photoPath },
    { key: 'show_education_level', label: 'Educational level' },
    { key: 'show_grade', label: 'Class / grade' },
    { key: 'show_school', label: 'School name', locked: !can.school },
    { key: 'show_city', label: 'City', locked: !can.location },
    { key: 'show_district', label: 'District', locked: !can.location },
    { key: 'show_story', label: 'Student story', locked: !can.story },
    { key: 'show_goal', label: 'Educational goals' },
    { key: 'show_background', label: 'Educational background' },
    { key: 'show_support', label: 'Support requirements' },
    { key: 'show_amount', label: 'Estimated support amount' },
    { key: 'show_achievements', label: 'Educational achievements' },
  ];

  return (
    <div>
      <Link
        href={`/admin/applications/${app.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" /> Back to application {app.application_code}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-deep">
            {isPublished ? 'Edit Public Profile' : 'Edit & Prepare Public Profile'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Application {app.application_code} · {app.full_name}
          </p>
        </div>
        <Badge className={isPublished ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800 border-0'}>
          {isPublished ? 'Published — live on website' : 'Draft — not visible to public'}
        </Badge>
      </div>

      {!can.story && !can.name && !can.photo && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          This student declined all public display options (name, photo and story). Their profile cannot be
          published — you can still support them privately.
        </p>
      )}

      <Tabs defaultValue="content" className="mt-8">
        <TabsList className="rounded-full bg-sage/50 p-1">
          <TabsTrigger value="content" className="rounded-full">Profile Content</TabsTrigger>
          <TabsTrigger value="visibility" className="rounded-full">Visibility</TabsTrigger>
          <TabsTrigger value="consent" className="rounded-full">Consent Record</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h2 className="mb-5 font-display text-lg font-semibold text-forest-deep">Public identity</h2>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="pe-mode">How should the student be identified publicly?</Label>
                  <Select
                    value={state.display_mode}
                    onValueChange={(v: DisplayMode) => set('display_mode', v)}
                  >
                    <SelectTrigger id="pe-mode" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anonymous">{displayNameLabel('anonymous')}</SelectItem>
                      <SelectItem value="full_name" disabled={!can.name}>{displayNameLabel('full_name')}</SelectItem>
                      <SelectItem value="first_name" disabled={!can.name}>{displayNameLabel('first_name')}</SelectItem>
                      <SelectItem value="alias">{displayNameLabel('alias')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!can.name && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Real-name options are locked — the student did not consent to
                      public display of their name.
                    </p>
                  )}
                </div>
                {state.display_mode === 'alias' && (
                  <div>
                    <Label htmlFor="pe-alias">Public alias *</Label>
                    <Input
                      id="pe-alias"
                      className="mt-2"
                      value={state.display_name}
                      onChange={(e) => set('display_name', e.target.value)}
                      placeholder="e.g. Ayesha from Multan"
                    />
                  </div>
                )}
                {state.display_mode === 'full_name' && (
                  <div>
                    <Label htmlFor="pe-dn">Display name (defaults to full legal name)</Label>
                    <Input
                      id="pe-dn"
                      className="mt-2"
                      value={state.display_name}
                      onChange={(e) => set('display_name', e.target.value)}
                      placeholder={app.full_name}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="mb-5 font-display text-lg font-semibold text-forest-deep">Public details</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pe-level">Education level</Label>
                  <Select value={state.education_level} onValueChange={(v) => set('education_level', v)}>
                    <SelectTrigger id="pe-level" className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pe-cat">Support category</Label>
                  <Select value={state.support_category} onValueChange={(v: SupportCategory) => set('support_category', v)}>
                    <SelectTrigger id="pe-cat" className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pe-grade">Class / grade</Label>
                  <Input id="pe-grade" className="mt-2" value={state.current_grade} onChange={(e) => set('current_grade', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pe-school">School name {can.school ? '' : '(no consent)'}</Label>
                  <Input
                    id="pe-school"
                    className="mt-2"
                    value={state.school_name}
                    onChange={(e) => set('school_name', e.target.value)}
                    disabled={!can.school}
                  />
                </div>
                <div>
                  <Label htmlFor="pe-city">City {can.location ? '' : '(no consent)'}</Label>
                  <Input id="pe-city" className="mt-2" value={state.city} onChange={(e) => set('city', e.target.value)} disabled={!can.location} />
                </div>
                <div>
                  <Label htmlFor="pe-district">District {can.location ? '' : '(no consent)'}</Label>
                  <Input id="pe-district" className="mt-2" value={state.district} onChange={(e) => set('district', e.target.value)} disabled={!can.location} />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-5 font-display text-lg font-semibold text-forest-deep">Public story & needs</h2>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="pe-story">Student story {can.story ? '' : '(no consent — will be hidden)'}</Label>
                  <Textarea id="pe-story" rows={5} className="mt-2" value={state.story} onChange={(e) => set('story', e.target.value)} disabled={!can.story} />
                </div>
                <div>
                  <Label htmlFor="pe-goal">Educational goal</Label>
                  <Textarea id="pe-goal" rows={3} className="mt-2" value={state.goal} onChange={(e) => set('goal', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pe-bg">Educational background</Label>
                  <Textarea id="pe-bg" rows={3} className="mt-2" value={state.background} onChange={(e) => set('background', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pe-support">Support requirement</Label>
                  <Textarea id="pe-support" rows={3} className="mt-2" value={state.support_requirement} onChange={(e) => set('support_requirement', e.target.value)} placeholder="What exactly does the support pay for?" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pe-amount">Estimated support amount (PKR / month)</Label>
                    <Input id="pe-amount" type="number" min="0" className="mt-2" value={state.estimated_amount_pkr} onChange={(e) => set('estimated_amount_pkr', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="pe-ach">Educational achievements</Label>
                    <Input id="pe-ach" className="mt-2" value={state.achievements} onChange={(e) => set('achievements', e.target.value)} placeholder="e.g. Top of class in Grade 7" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-5 font-display text-lg font-semibold text-forest-deep">Public photograph</h2>
              {can.photo ? (
                <>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-sage">
                    {photoPath && photoUrl && state.photo_public ? (
                      <img
                        src={photoUrl}
                        alt="Student"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        No photo shown
                      </div>
                    )}
                  </div>
                  <input
                    ref={photoRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(f);
                      e.target.value = '';
                    }}
                    aria-label="Upload public photo"
                  />
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => photoRef.current?.click()} disabled={photoUploading || saving || publishing} className="rounded-full">
                      {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {photoPath ? 'Replace' : 'Upload'}
                    </Button>
                    {photoPath && (
                          <Button variant="outline" size="sm" onClick={removePhoto} disabled={saving || publishing} className="rounded-full text-destructive">
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-ivory p-3">
                    <span className="text-sm">Show photo publicly</span>
                    <Switch checked={state.photo_public} onCheckedChange={(v) => set('photo_public', v)} />
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" /> The student has not consented to a public photograph.
                </p>
              )}
            </Card>

            <Card className="border-gold/40 bg-gold/5">
              <h2 className="mb-3 font-display text-lg font-semibold text-forest-deep">Publishing</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {isPublished
                  ? 'This profile is live. Unpublish to hide it; existing photo links expire within 60 seconds.'
                  : 'Save as a draft first, preview it, then publish when you are satisfied.'}
              </p>
              <div className="space-y-3">
                <Button onClick={handleSaveDraft} disabled={saving || publishing || photoUploading} className="w-full rounded-full bg-forest text-white hover:bg-forest-deep">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isPublished ? 'Save (stays live)' : 'Save Draft'}
                </Button>

                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-full">
                      <Eye className="h-4 w-4" /> Preview Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <ProfilePreview
                      name={previewName}
                      photoUrl={photoPath && state.photo_public ? photoUrl : null}
                      state={state}
                      publicCode={app.application_code}
                    />
                  </DialogContent>
                </Dialog>

                {isPublished ? (
                  <>
                    <Button onClick={handlePublish} disabled={publishing || saving || photoUploading} className="w-full rounded-full bg-gold text-forest-deep hover:brightness-105">
                      {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                      Save and Publish Changes
                    </Button>
                    <Button onClick={handleUnpublish} disabled={publishing || photoUploading} variant="outline" className="w-full rounded-full text-destructive hover:bg-destructive/10">
                      <Lock className="h-4 w-4" /> Unpublish
                    </Button>
                  </>
                ) : (
                  <Button onClick={handlePublish} disabled={publishing || saving || photoUploading} className="w-full rounded-full bg-gold text-forest-deep hover:brightness-105">
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                    Publish / Display on Website
                  </Button>
                )}

                {profile && (
                  <Link
                    href={`/students/${profile.public_code.toLowerCase()}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 pt-2 text-sm font-medium text-forest hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> Open public page
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visibility" className="mt-6">
          <Card>
            <h2 className="font-display text-lg font-semibold text-forest-deep">Individual visibility controls</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the fields switched ON below appear on the public website. Switches marked with a lock are held
              off because the student or guardian did not consent to that disclosure.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {switches.map((s) => (
                <div
                  key={s.key}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    s.locked ? 'border-border bg-muted/40 opacity-70' : 'border-border bg-ivory'
                  }`}
                >
                  <span className="text-sm font-medium text-charcoal">
                    {s.label}
                    {s.locked && <Lock className="ml-2 inline h-3 w-3 text-muted-foreground" />}
                  </span>
                  <Switch
                    checked={s.locked ? false : (state[s.key] as boolean)}
                    onCheckedChange={(v) => set(s.key, v as never)}
                    disabled={s.locked}
                    aria-label={s.label}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="mt-6">
          <Card>
            <h2 className="font-display text-lg font-semibold text-forest-deep">Recorded consents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recorded when the student applied. Publication never exceeds these permissions — the database itself
              blocks it.
            </p>
            {consents ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {([
                  ['Real name', consents.consent_name],
                  ['Photograph', consents.consent_photo],
                  ['Educational story', consents.consent_story],
                  ['School name', consents.consent_school],
                  ['Location', consents.consent_location],
                  ['Progress updates', consents.consent_progress_updates],
                  ['Guardian consent', consents.guardian_consent],
                  ['Information accurate', consents.confirm_accurate],
                ] as [string, boolean][]).map(([label, ok]) => (
                  <li key={label} className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3">
                    <span className="text-sm text-charcoal">{label}</span>
                    <Badge className={ok ? 'bg-forest text-white' : ''} variant={ok ? 'default' : 'secondary'}>
                      {ok ? 'Given' : 'Declined'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No consent record was found for this application.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

function ProfilePreview({
  name, photoUrl, state, publicCode,
}: {
  name: string;
  photoUrl: string | null;
  state: EditorState;
  publicCode: string;
}) {
  return (
    <div>
      <DialogHeader>
        <DialogTitle>Preview — exactly what the public will see</DialogTitle>
      </DialogHeader>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="bg-forest-deep px-8 py-10 text-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-forest">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/40">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">Student Profile · {publicCode}</p>
              <h3 className="mt-1 font-display text-2xl font-semibold">{name}</h3>
              <p className="mt-1 text-sm text-white/70">
                {[
                  state.show_education_level ? educationLevelLabel(state.education_level) : '',
                  state.show_city && state.city ? state.city : '',
                  state.show_district && state.district ? state.district : '',
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6 bg-card px-8 py-8">
          {state.show_school && state.school_name && <Fact icon={SchoolIcon} label="Institution" value={state.school_name} />}
          {state.show_grade && state.current_grade && <Fact icon={SchoolIcon} label="Current grade" value={state.current_grade} />}
          {state.show_story && state.story && <Block title="Their story" text={state.story} />}
          {state.show_background && state.background && <Block title="Educational background" text={state.background} />}
          {state.show_goal && state.goal && <Block title="Educational goal" text={state.goal} />}
          {state.show_achievements && state.achievements && <Block title="Achievements" text={state.achievements} />}
          {state.show_support && state.support_requirement && <Block title="Support needed" text={state.support_requirement} />}
          {state.show_amount && state.estimated_amount_pkr && (
            <div className="rounded-xl bg-sage/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estimated support needed</p>
              <p className="mt-1 font-display text-xl font-semibold text-forest-deep">{formatPKR(Number(state.estimated_amount_pkr))} / month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SchoolIcon() {
  return <span className="mt-1 block h-2 w-2 rounded-full bg-forest" />;
}

function Fact({ icon: Icon, label, value }: { icon: () => React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon />
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-charcoal">{value}</p>
      </div>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="font-display text-base font-semibold text-forest-deep">{title}</h4>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
