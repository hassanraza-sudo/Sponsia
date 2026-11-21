import { StudentGrid } from '@/components/site/student-grid';

export const metadata = { title: 'Explore Students' };

export default function StudentsPage() {
  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Explore Students</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Verified students, waiting for a chance.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Every profile below was personally verified by our team and published with the student’s consent.
            Behind each one is a real educational need you can help meet.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight">
          <StudentGrid />
        </div>
      </section>
    </div>
  );
}
