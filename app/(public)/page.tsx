import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  HeartHandshake,
  FileCheck2,
  Users,
  Lock,
  Landmark,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings } from '@/lib/settings';
import {
  educationLevelLabel,
  supportCategoryLabel,
  resolvedDisplayName,
  type PublishedStudentProfile,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

type FeaturedProfile = PublishedStudentProfile & { photo_url: string | null };

async function getFeaturedProfiles(): Promise<FeaturedProfile[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('published_student_profiles')
    .select('*')
    .eq('publication_status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);
  if (error) {
    console.error('Could not load featured student profiles.', error);
    return [];
  }

  return Promise.all((data ?? []).map(async (profile) => {
    if (!profile.photo_public || !profile.photo_path) return { ...profile, photo_url: null };
    const { data: photo, error: photoError } = await supabase.storage
      .from('public-profiles')
      .createSignedUrl(profile.photo_path, 60);
    if (photoError) {
      console.error(`Could not sign the profile photo for ${profile.public_code}.`, photoError);
      return { ...profile, photo_url: null };
    }
    return { ...profile, photo_url: photo.signedUrl };
  }));
}

function ProfilePhoto({ profile }: { profile: FeaturedProfile }) {
  if (profile.photo_public && profile.photo_url) {
    return (
      <img
        src={profile.photo_url}
        alt={resolvedDisplayName(profile.display_mode, profile.display_name, null, profile.public_code)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-sage">
      <GraduationCap className="h-16 w-16 text-forest/30" />
    </div>
  );
}

const steps = [
  {
    icon: FileCheck2,
    title: 'Students Apply',
    text: 'Students or guardians submit an educational support application.',
  },
  {
    icon: ShieldCheck,
    title: 'We Verify',
    text: 'Sponsia reviews the application and verifies educational needs.',
  },
  {
    icon: HeartHandshake,
    title: 'Support Education',
    text: 'Potential supporters can explore verified profiles and contact us about sponsorship.',
  },
];

const transparencyPoints = [
  {
    icon: ShieldCheck,
    title: 'Manual student verification',
    text: 'Every application is personally reviewed and verified before any profile is published. Nothing is automated or taken at face value.',
  },
  {
    icon: BookOpen,
    title: 'Educational needs assessment',
    text: 'We assess the actual educational costs — fees, books, uniform, transport — so supporters know exactly what their support enables.',
  },
  {
    icon: Lock,
    title: 'Respectful handling of student information',
    text: 'We publish only what students and guardians have approved. Anonymous profiles are always an option, and never a disadvantage.',
  },
  {
    icon: Landmark,
    title: 'Institution-focused support model',
    text: 'Support is directed toward the student’s institution and verified educational expenses, keeping every rupee accountable.',
  },
  {
    icon: RefreshCw,
    title: 'Accountability and progress updates',
    text: 'With consent, we share educational progress updates so supporters can see the difference they are making.',
  },
];

export default async function HomePage() {
  const [settings, profiles] = await Promise.all([getSettings(), getFeaturedProfiles()]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #DCE8DF 0, transparent 45%), radial-gradient(circle at 80% 70%, #C8A96B 0, transparent 45%)',
          }}
        />
        <div className="container-tight relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/80 animate-fade-up">
              <span>A Friend of Education</span>
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.15] text-balance sm:text-5xl lg:text-6xl animate-fade-up-delay-1">
              {settings.hero_heading}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 animate-fade-up-delay-2">
              {settings.hero_description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 animate-fade-up-delay-3">
              <Link
                href="/students"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-forest-deep transition-all hover:shadow-lg hover:shadow-black/20"
              >
                Explore Students
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Apply for Support
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest-deep to-charcoal shadow-2xl shadow-black/30">
              {settings.hero_image_url ? (
                <img
                  src={settings.hero_image_url}
                  alt="Students in a classroom"
                  className="h-full w-full object-cover"
                />
              ) : (
              <div className="flex h-full flex-col justify-between p-10">
                <GraduationCap className="h-12 w-12 text-gold" />
                <div className="space-y-4">
                  <p className="font-display text-3xl leading-snug text-white/90">
                    “We don’t showcase poverty. We showcase potential.”
                  </p>
                  <p className="text-white/60">— The Sponsia philosophy</p>
                </div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full bg-white/15">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${(i + 1) * 20}%` }} />
                    </span>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-ivory py-20 md:py-24">
        <div className="container-tight max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold text-forest-deep sm:text-4xl">
            Education Should Never Stop Because of Financial Barriers.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {settings.mission_content ||
              'Across Pakistan, capable students are forced to leave school every year — not because they lack ability or ambition, but because their families cannot afford fees, books, uniforms or transport. Sponsia exists to close that gap. We listen to students, verify their circumstances with care, and introduce them to people who are ready to invest in their education.'}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24">
        <div className="container-tight">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-forest-deep sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps, built on trust and verification.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/5"
              >
                <span className="absolute right-6 top-6 font-display text-5xl font-semibold text-sage">
                  {i + 1}
                </span>
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-xl font-semibold text-forest-deep">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 font-semibold text-forest hover:text-forest-deep"
            >
              Learn more about the process <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured students */}
      <section className="bg-sage/40 py-20 md:py-24">
        <div className="container-tight">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold text-forest-deep sm:text-4xl">
                Students Waiting for Support
              </h2>
              <p className="mt-3 text-muted-foreground">
                Verified profiles, published with the student’s consent.
              </p>
            </div>
            {profiles.length > 0 && (
              <Link
                href="/students"
                className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
              >
                View all students <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-forest/25 bg-card/60 px-8 py-16 text-center">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
                <Users className="h-8 w-8 text-forest" />
              </span>
              <h3 className="font-display text-xl font-semibold text-forest-deep">
                Student profiles are coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Our team is currently verifying applications. As soon as profiles are verified and published, they
                will appear here. Please check back soon, or reach out to us directly.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
              >
                Get in touch <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/students/${p.public_code.toLowerCase()}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <ProfilePhoto profile={p} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {p.show_education_level && <span>{educationLevelLabel(p.education_level)}</span>}
                      {p.show_education_level && p.show_city && p.city && <span aria-hidden>·</span>}
                      {p.show_city && p.city && <span>{p.city}</span>}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold text-forest-deep">
                      {resolvedDisplayName(p.display_mode, p.display_name, null, p.public_code)}
                    </h3>
                    {p.show_goal && p.goal && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.goal}</p>
                    )}
                    {p.show_support && p.support_requirement && (
                      <span className="mt-4 inline-block rounded-full bg-sage px-3 py-1 text-xs font-medium text-forest">
                        Needs: {supportCategoryLabel(p.support_category)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Transparency */}
      <section className="py-20 md:py-24">
        <div className="container-tight">
          <div className="mb-12 max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-forest-deep sm:text-4xl">
              Transparency, at every step
            </h2>
            <p className="mt-3 text-muted-foreground">
              Trust is the foundation of this platform. Here is how we earn it.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {transparencyPoints.map((t) => (
              <div key={t.title} className="rounded-2xl bg-ivory p-7 ring-1 ring-border">
                <t.icon className="mb-4 h-6 w-6 text-forest" />
                <h3 className="font-semibold text-forest-deep">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a supporter */}
      <section className="bg-forest text-white">
        <div className="container-tight flex flex-col items-center gap-8 py-20 text-center md:py-24">
          <HeartHandshake className="h-12 w-12 text-gold" />
          <h2 className="max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            Become a Supporter
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-white/75">
            Whether you are an individual, a family, an organisation or an international donor — if you believe that
            every child deserves access to education, we would love to hear from you. Tell us how you would like to
            help, and our team will be in touch.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 font-semibold text-forest-deep transition-all hover:shadow-lg hover:shadow-black/25"
          >
            Become a Supporter <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-white/50">
            Note: online payment collection is not yet available. Support begins with a conversation.
          </p>
        </div>
      </section>
    </div>
  );
}
