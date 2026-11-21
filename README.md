# Sponsia

**Every Student Deserves a Chance.**

A full-stack education support platform that connects financially struggling students in
Pakistan with donors and organisations. Students apply for support; the administrator
verifies each application, prepares a public profile with strict privacy controls, and
publishes it to the website. Supporters browse verified profiles and send sponsorship
enquiries. No payments are collected (pre-launch phase).

---

## 1. What is included

### Public website
- **Home** — hero (editable in Settings), mission, how-it-works, featured published students (live from the database), transparency section, supporter CTA
- **Explore Students** (`/students`) — published profiles with search + filters (level, support category, location)
- **Student profile** (`/students/td-1001`) — shows only admin-approved fields; "Support This Student" opens a real enquiry form
- **Apply for Support** (`/apply`) — 5-section application: personal, educational, financial (PKR), document uploads, granular consent switches. No account needed. Issues a reference like `TD-1001`
- **How It Works**, **About Us**, **Contact Us** (`/contact`), **Become a Supporter** (`/support`), **Privacy Policy**, **Terms and Conditions**

### Private admin dashboard (`/admin`)
- `/admin/login` — email/password sign-in (Supabase Auth). No sign-up. No public links.
- **Overview** — live database statistics
- **Student Applications** — searchable/filterable table; detail view with full application, secure document download (short-lived signed URLs), status changes, editable fields, private notes, archive
- **Where submissions go** — application details and the unique reference are saved in Supabase and appear in **`/admin/applications`**; consent choices are saved with the application, and uploaded files are stored in the private `application-documents` bucket.
- **Edit & Prepare Public Profile** — the publishing workflow:
  - Identity modes: full name / first name / alias / anonymous ("Student TD-1001")
  - Individual ON/OFF visibility switches for every profile field
  - Consent-gated: switches for fields the student declined are locked off
  - Photo upload (public bucket), story, goal, background, support requirement, amount, achievements
  - **Save Draft → Preview → Publish / Display on Website**; later **Save and Publish Changes** and **Unpublish**
- **Published Students** — publish/unpublish/edit any profile
- **Donor Enquiries** and **Contact Enquiries** — detail panel, status workflow (New/Contacted/Interested/Closed), private notes
- **Settings** — branding, homepage hero/mission, contact details and social links; changes appear on the public site immediately

### Security model
- **RLS on every table.** Anonymous visitors can only INSERT applications/enquiries and SELECT published profiles + settings. Private application data is unreachable.
- **Consent enforced in the database**: a trigger strips visibility flags that exceed the recorded consent, and refuses to publish a minor's profile without guardian consent.
- **Admin authorisation**: `is_admin()` (SECURITY DEFINER) checks the signed-in auth user against the `admin_users` allowlist. Enforced in middleware, in the admin layout, and in every RLS policy.
- **Unique references**: `application_code` has a database uniqueness constraint, and codes come from an atomic database counter. A migration reconciles those counters against existing application and enquiry records before new references are issued.
- **Documents** live in the private `application-documents` bucket; access is via 5-minute signed URLs, admin-only.
- **Photos** live in the public `public-profiles` bucket, but rows only display them when `photo_public` is on and consent exists.

---

## 2. Setup

### 2.1 Environment variables
The project expects (already provided in Bolt's environment; for your own deployment add
them in Vercel → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your publishable public key>
```

The website only needs the publishable key. Never expose a secret or service-role key
in frontend code or `NEXT_PUBLIC_*` variables.

### 2.2 Database
Run `supabase/migrations/20261117000000_initial_schema.sql` first, then apply the remaining
migrations in timestamp order via the Supabase dashboard SQL editor or the CLI. The initial
migration creates the tables and access policies used by the app; the later migrations
depend on it.

### 2.3 Create your administrator account (important)

Admin accounts are **never** created through the website. To add yourself:

1. Open your Supabase dashboard → **Authentication → Users → Add user**.
2. Enter your email and a strong password. Leave "Auto confirm user" ON.
3. Copy the **user ID (UUID)** of the new user.
4. Go to **SQL Editor** and run:

```sql
INSERT INTO admin_users (id) VALUES ('paste-your-user-uuid-here');
```

5. Visit `/admin/login` on your website and sign in. You now have full dashboard access.

To revoke an admin later: `DELETE FROM admin_users WHERE id = 'uuid';`

The email/password are stored only in Supabase Auth — nothing is hardcoded in the
source code.

### 2.4 Storage buckets
- `application-documents` — **private** (default). Holds fee challans, marksheets, etc.
- `public-profiles` — public bucket holding admin-uploaded profile photos.

The `20261119190000_provision_application_documents_bucket.sql` migration provisions the
private `application-documents` bucket and permits anonymous uploads only into a
UUID-named application folder. Uploads are limited to 5 MB and the file types accepted
by the application form. Reads remain admin-only via signed URLs.

---

## 3. Deployment

1. Push the repository to GitHub.
2. Import the repo in Vercel; add the two `NEXT_PUBLIC_*` environment variables.
3. Deploy. Next.js App Router pages using live data are dynamic (`force-dynamic`), so
   published profiles and settings appear without rebuilds.

---

## 4. The core workflow

```
Student submits /apply  →  unique reference issued, application saved in Supabase, files stored privately
        ↓
Application appears in /admin/applications (Pending; admin sign-in required)
        ↓
You review → set Under Review → verify documents & details
        ↓
Approve → "Edit & Prepare Public Profile"
        ↓
Choose identity mode, switch fields on/off (consent-gated), write the story
        ↓
Save Draft → Preview → Publish / Display on Website
        ↓
Profile is live at /students/td-1001, listed on Explore Students and the homepage
        ↓
Unpublish anytime — the application record is never deleted
```

## 5. Notes

- Currency is PKR throughout.
- Online payment collection is intentionally not implemented; enquiry-only flow.
- Placeholder contact details are clearly labelled until you set real ones in Settings.
