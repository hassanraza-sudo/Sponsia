import { EDUCATION_LEVELS, type DonorEnquiry, type EducationLevel } from './types';

export { EDUCATION_LEVELS, type EducationLevel };

export const EDUCATION_LABEL: Record<EducationLevel, string> = {
  primary: 'Primary School',
  middle: 'Middle School',
  secondary: 'Secondary School',
  higher_secondary: 'Higher Secondary / College',
};

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

export const ENQUIRY_STATUS_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  closed: 'Closed',
};

export const SPONSORSHIP_TYPE_LABEL: Record<DonorEnquiry['sponsorship_type'], string> = {
  one_student: 'Sponsor one student',
  educational_expenses: 'Support educational expenses',
  general_support: 'General education support',
  partnership: 'Discuss an organisational partnership',
};
