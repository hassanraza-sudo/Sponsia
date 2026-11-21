export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export type EducationLevel =
  | 'primary'
  | 'middle'
  | 'secondary'
  | 'higher_secondary';

export type DisplayMode = 'full_name' | 'first_name' | 'alias' | 'anonymous';

export type PublicationStatus = 'draft' | 'published';

export type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'closed';

export type SupportCategory =
  | 'tuition'
  | 'books'
  | 'uniform'
  | 'transport'
  | 'general';

export interface StudentApplication {
  id: string;
  application_code: string;
  status: ApplicationStatus;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  guardian_name: string;
  guardian_phone: string;
  student_phone: string | null;
  email: string | null;
  city: string;
  district: string;
  address: string;
  education_level: EducationLevel;
  institution_name: string;
  current_grade: string;
  academic_performance: string | null;
  educational_goal: string | null;
  support_reason: string | null;
  at_risk: boolean;
  expenses_monthly: number | null;
  expense_tuition: number | null;
  expense_books: number | null;
  expense_uniform: number | null;
  expense_transport: number | null;
  expense_other: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentConsents {
  id: string;
  application_id: string;
  confirm_accurate: boolean;
  guardian_consent: boolean;
  consent_name: boolean;
  consent_photo: boolean;
  consent_story: boolean;
  consent_school: boolean;
  consent_location: boolean;
  consent_progress_updates: boolean;
  created_at: string;
}

export interface StudentPublicProfile {
  id: string;
  application_id: string;
  public_code: string;
  display_mode: DisplayMode;
  display_name: string | null;
  photo_path: string | null;
  photo_public: boolean;
  education_level: string;
  show_education_level: boolean;
  show_grade: boolean;
  show_school: boolean;
  school_name: string | null;
  current_grade: string | null;
  show_city: boolean;
  show_district: boolean;
  city: string | null;
  district: string | null;
  show_story: boolean;
  story: string | null;
  show_goal: boolean;
  goal: string | null;
  show_background: boolean;
  background: string | null;
  show_support: boolean;
  support_requirement: string | null;
  show_amount: boolean;
  estimated_amount_pkr: number | null;
  show_achievements: boolean;
  achievements: string | null;
  support_category: SupportCategory;
  publication_status: PublicationStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishedStudentProfile {
  id: string;
  public_code: string;
  display_mode: DisplayMode;
  display_name: string | null;
  photo_path: string | null;
  photo_public: boolean;
  education_level: string;
  show_education_level: boolean;
  show_grade: boolean;
  current_grade: string | null;
  show_school: boolean;
  school_name: string | null;
  show_city: boolean;
  show_district: boolean;
  city: string | null;
  district: string | null;
  show_story: boolean;
  story: string | null;
  show_goal: boolean;
  goal: string | null;
  show_background: boolean;
  background: string | null;
  show_support: boolean;
  support_requirement: string | null;
  show_amount: boolean;
  estimated_amount_pkr: number | null;
  show_achievements: boolean;
  achievements: string | null;
  support_category: SupportCategory;
  publication_status: PublicationStatus;
  published_at: string | null;
}

export interface StudentDocument {
  id: string;
  application_id: string;
  doc_type: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface DonorEnquiry {
  id: string;
  enquiry_code: string;
  application_id: string | null;
  student_public_code: string | null;
  student_name: string | null;
  donor_name: string;
  donor_email: string;
  country: string;
  donor_phone: string | null;
  proposed_amount_pkr: number | null;
  sponsorship_type:
    | 'one_student'
    | 'educational_expenses'
    | 'general_support'
    | 'partnership';
  message: string;
  status: EnquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactEnquiry {
  id: string;
  enquiry_code: string;
  full_name: string;
  email: string;
  country: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  site_name: string;
  tagline: string;
  site_description: string;
  hero_heading: string;
  hero_description: string;
  hero_image_url: string;
  mission_content: string;
  about_content: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  office_address: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
  youtube_url: string;
}

export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'higher_secondary', label: 'Higher Secondary / College' },
];

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: 'tuition', label: 'Tuition Fees' },
  { value: 'books', label: 'Books & Stationery' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'transport', label: 'Transport' },
  { value: 'general', label: 'General Support' },
];

export const SPONSORSHIP_TYPES: { value: DonorEnquiry['sponsorship_type']; label: string }[] = [
  { value: 'one_student', label: 'Sponsor one student' },
  { value: 'educational_expenses', label: 'Support educational expenses' },
  { value: 'general_support', label: 'General education support' },
  { value: 'partnership', label: 'Discuss an organisational partnership' },
];

export function educationLevelLabel(level: string): string {
  return EDUCATION_LEVELS.find((l) => l.value === level)?.label ?? level;
}

export function supportCategoryLabel(cat: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function formatPKR(amount: number | null | undefined): string {
  if (amount == null) return '';
  return `PKR ${new Intl.NumberFormat('en-PK').format(amount)}`;
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function resolvedDisplayName(
  mode: DisplayMode,
  displayName: string | null,
  realName: string | null,
  publicCode: string
): string {
  if (mode === 'anonymous' || (!displayName && mode === 'alias')) {
    return `Student ${publicCode}`;
  }
  if (mode === 'alias') return displayName || `Student ${publicCode}`;
  if (mode === 'first_name') return (displayName || realName || '').split(' ')[0] || `Student ${publicCode}`;
  return displayName || realName || `Student ${publicCode}`;
}
