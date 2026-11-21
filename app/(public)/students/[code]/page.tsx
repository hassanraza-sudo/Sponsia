import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  GraduationCap,
  MapPin,
  School,
  Target,
  BookOpen,
  HandHeart,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings } from '@/lib/settings';
import {
  educationLevelLabel,
  formatPKR,
  resolvedDisplayName,
  type PublishedStudentProfile,
} from '@/lib/types';
import { DonorEnquiryDialog } from '@/components/site/donor-enquiry-dialog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('published_student_profiles')
    .select('public_code, display_mode, display_name')
    .eq('public_code', params.code.toUpperCase())
    .eq('publication_status', 'published')
    .maybeSingle();
  if (!data) return { title: 'Student Profile' };
  const name = resolvedDisplayName(data.display_mode, data.display_name, null, data.public_code);
  return { title: `${name} — Student Profile` };
}

export default async function StudentProfilePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();
  const supabase = createPublicClient();
  const { data: profile } = await supabase
    .from('published_student_profiles')
    .select('*')
    .eq('public_code', code)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!profile) notFound();

  const p = profile as PublishedStudentProfile;
  const name = resolvedDisplayName(p.display_mode, p.display_name, null, p.public_code);
  let photoUrl: string | null = null;
  if (p.photo_public && p.photo_path) {
    const { data, error } = await supabase.storage
      .from('public-profiles')
      .createSignedUrl(p.photo_path, 60);
    if (error) {
      console.error(`Could not sign the profile photo for ${p.public_code}.`, error);
    } else {
      photoUrl = data.signedUrl;
    }
  }

  const facts: { icon: React.ElementType; label: string; value: string }[] = [];
  if (p.show_education_level)
    facts.push({ icon: GraduationCap, label: 'Education level', value: educationLevelLabel(p.education_level) });
  if (p.show_grade && p.current_grade)
    facts.push({ icon: BookOpen, label: 'Current grade', value: p.current_grade });
  if (p.show_school && p.school_name)
    facts.push({ icon: School, label: 'Institution', value: p.school_name });
  if (p.show_city && p.city)
    facts.push({ icon: MapPin, label: 'City', value: p.show_district && p.district ? `${p.city}, ${p.district}` : p.city });
  else if (p.show_district && p.district)
    facts.push({ icon: MapPin, label: 'District', value: p.district });

  const settings = await getSettings();

  return (
    <div>
      <section className="bg-forest-deep py-12 text-white md:py-16">
        <div className="container-tight max-w-5xl">
          <Link
            href="/students"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all students
          </Link>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="h-36 w-36 shrink-0 overflow-hidden rounded-3xl bg-forest shadow-xl ring-4 ring-white/10">
              {p.photo_public && photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <GraduationCap className="h-14 w-14 text-white/30" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-gold">Student Profile · {p.public_code}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/70">
                {p.show_education_level && <span>{educationLevelLabel(p.education_level)}</span>}
                {p.show_city && p.city && <span aria-hidden>·</span>}
                {p.show_city && p.city && <span>{p.city}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-tight grid max-w-5xl gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-10">
            {facts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage">
                      <f.icon className="h-5 w-5 text-forest" />
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{f.label}</p>
                      <p className="mt-0.5 font-medium text-charcoal">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {p.show_story && p.story && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest-deep">Their story</h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.story}</p>
              </div>
            )}

            {p.show_background && p.background && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest-deep">Educational background</h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.background}</p>
              </div>
            )}

            {p.show_goal && p.goal && (
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-deep">
                  <Target className="h-5 w-5 text-forest" /> Educational goal
                </h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.goal}</p>
              </div>
            )}

            {p.show_achievements && p.achievements && (
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-deep">
                  <Sparkles className="h-5 w-5 text-forest" /> Achievements
                </h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.achievements}</p>
              </div>
            )}

            {p.show_support && p.support_requirement && (
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-forest-deep">
                  <HandHeart className="h-5 w-5 text-forest" /> Support needed
                </h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{p.support_requirement}</p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-8">
              <ShieldCheck className="mb-4 h-8 w-8 text-forest" />
              <h2 className="font-display text-xl font-semibold text-forest-deep">Verified profile</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This profile was personally reviewed and verified by the Sponsia team, and published with the
                student’s consent.
              </p>

              {p.show_amount && p.estimated_amount_pkr != null && (
                <div className="mt-6 rounded-2xl bg-sage/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estimated support needed
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-forest-deep">
                    {formatPKR(p.estimated_amount_pkr)}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </p>
                </div>
              )}

              <div className="mt-6">
                <DonorEnquiryDialog
                  student={{ code: p.public_code, name }}
                  contactEmail={settings.contact_email}
                />
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No online payment is collected yet — an enquiry starts the conversation with our team.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
