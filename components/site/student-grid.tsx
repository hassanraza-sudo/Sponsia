'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, MapPin, Search, ArrowRight } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import {
  EDUCATION_LEVELS,
  SUPPORT_CATEGORIES,
  educationLevelLabel,
  supportCategoryLabel,
  resolvedDisplayName,
  type PublishedStudentProfile,
} from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PublicProfile = PublishedStudentProfile & { photo_url: string | null };

export function StudentGrid() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');

  useEffect(() => {
    const supabase = createPublicClient();
    supabase
      .from('published_student_profiles')
      .select('*')
      .eq('publication_status', 'published')
      .order('published_at', { ascending: false })
      .then(async ({ data, error }) => {
        if (error) {
          console.error('Could not load student profiles.', error);
          setProfiles([]);
          setLoading(false);
          return;
        }
        const signedProfiles = await Promise.all((data ?? []).map(async (profile) => {
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
        setProfiles(signedProfiles);
        setLoading(false);
      });
  }, []);

  const locations = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.show_city && p.city) set.add(p.city);
      else if (p.show_district && p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (level !== 'all' && p.education_level !== level) return false;
      if (category !== 'all' && p.support_category !== category) return false;
      if (location !== 'all') {
        const loc = (p.show_city && p.city) || (p.show_district && p.district) || '';
        if (loc !== location) return false;
      }
      if (q) {
        const haystack = [
          resolvedDisplayName(p.display_mode, p.display_name, null, p.public_code),
          p.show_city ? p.city : '',
          p.show_district ? p.district : '',
          p.show_goal ? p.goal : '',
          p.show_story ? p.story : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, search, level, category, location]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-border bg-card">
            <div className="aspect-[4/3] rounded-t-2xl bg-muted" />
            <div className="space-y-3 p-6">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-6 w-2/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or goal…"
            className="rounded-full bg-card py-3 pl-11"
            aria-label="Search students"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="rounded-full bg-card py-3" aria-label="Filter by education level">
              <SelectValue placeholder="Education level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {EDUCATION_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-full bg-card py-3" aria-label="Filter by support category">
              <SelectValue placeholder="Support category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All support needs</SelectItem>
              {SUPPORT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="rounded-full bg-card py-3" aria-label="Filter by location">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-forest/25 bg-card/60 px-8 py-16 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
            <GraduationCap className="h-8 w-8 text-forest" />
          </span>
          {profiles.length === 0 ? (
            <>
              <h3 className="font-display text-xl font-semibold text-forest-deep">
                Student profiles are coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Our team is verifying applications right now. Published profiles will appear here — please check
                back soon.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-semibold text-forest-deep">No matching students</h3>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Try adjusting your search or filters to find more students.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const name = resolvedDisplayName(p.display_mode, p.display_name, null, p.public_code);
            return (
              <Link
                key={p.id}
                href={`/students/${p.public_code.toLowerCase()}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sage">
                  {p.photo_public && p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <GraduationCap className="h-16 w-16 text-forest/25" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.show_education_level && <span>{educationLevelLabel(p.education_level)}</span>}
                    {p.show_education_level && (p.show_city && p.city || p.show_district && p.district) && <span aria-hidden>·</span>}
                    {p.show_city && p.city && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                    )}
                    {!p.show_city && p.show_district && p.district && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.district}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-forest-deep">{name}</h3>
                  {p.show_goal && p.goal && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.goal}</p>
                  )}
                  <div className="mt-4 flex-1" />
                  <div className="flex items-center justify-between">
                    {p.show_support ? (
                      <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-forest">
                        {supportCategoryLabel(p.support_category)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest transition-colors group-hover:text-forest-deep">
                      View profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
