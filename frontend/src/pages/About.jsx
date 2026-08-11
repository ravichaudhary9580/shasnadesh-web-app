import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function About() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col justify-between">
      <SEO 
        title="About Us - Shasnadesh Updates"
        description="Learn about Shasnadeshupdates.com, our mission, editorial standards, verification process for government circulars, and our commitment to public information."
        url="https://shasnadeshupdates.com/about"
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex-1">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <span className="inline-block px-3 py-1 bg-saffron-50 text-saffron-700 text-xs font-semibold rounded-full border border-saffron-200">
              Independent Information Portal
            </span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink-900">
              About Shasnadesh Updates
            </h1>
            <p className="mt-2 text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
              Making official government orders, circulars, notifications, and public welfare schemes simple, accessible, and transparent for every citizen.
            </p>
          </div>

          {/* Mission */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Our Mission
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Government orders (शासन-आदेश / Circulars) are essential documents that directly impact employees, teachers, students, job seekers, and the general public. However, finding authentic copies and understanding complex official language can be challenging.
            </p>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              <strong>Shasnadeshupdates.com</strong> was established to bridge this information gap. We curate, verify, summarize, and publish official updates in clear, easy-to-understand Hindi and English, complete with direct PDF access and step-by-step guidance.
            </p>
          </section>

          {/* What We Provide Grid */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="bg-ink-50/70 border border-ink-100 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-saffron-500 text-white flex items-center justify-center font-bold text-sm">
                📋
              </div>
              <h3 className="font-ui font-semibold text-ink-900 text-sm">
                Government Orders (शासनादेश)
              </h3>
              <p className="text-ink-600 text-xs leading-relaxed">
                Timely updates on Uttar Pradesh government notifications, department circulars, cabinet decisions, and official policy changes.
              </p>
            </div>

            <div className="bg-ink-50/70 border border-ink-100 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-saffron-500 text-white flex items-center justify-center font-bold text-sm">
                🎓
              </div>
              <h3 className="font-ui font-semibold text-ink-900 text-sm">
                Education & Teachers Updates
              </h3>
              <p className="text-ink-600 text-xs leading-relaxed">
                Dedicated coverage for Basic Shiksha, Secondary Education, teacher transfers, salary updates, holiday calendars, and scholarship schemes.
              </p>
            </div>

            <div className="bg-ink-50/70 border border-ink-100 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-saffron-500 text-white flex items-center justify-center font-bold text-sm">
                💼
              </div>
              <h3 className="font-ui font-semibold text-ink-900 text-sm">
                Recruitment & Vacancies
              </h3>
              <p className="text-ink-600 text-xs leading-relaxed">
                Verified government job alerts, eligibility criteria, application process, syllabus, admit cards, and examination schedules.
              </p>
            </div>

            <div className="bg-ink-50/70 border border-ink-100 rounded-xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-saffron-500 text-white flex items-center justify-center font-bold text-sm">
                📄
              </div>
              <h3 className="font-ui font-semibold text-ink-900 text-sm">
                Official PDF Downloads
              </h3>
              <p className="text-ink-600 text-xs leading-relaxed">
                Direct, clean, and safe links to official PDF documents so readers can review original gazettes and orders directly.
              </p>
            </div>
          </div>

          {/* Editorial Integrity & Fact-Checking */}
          <section className="space-y-3 pt-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Editorial Integrity & Fact-Checking
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Accuracy and trust are the foundation of our work. Before publishing any order or news item, our editorial team cross-references the content against official government portals (such as shasnadesh.up.gov.in, state gazettes, and official department websites).
            </p>
            <ul className="list-disc list-inside text-ink-600 font-ui text-sm space-y-1 pl-2">
              <li>Strict verification against primary official sources before publishing.</li>
              <li>Clear demarcation between official order summaries and editorial guidance.</li>
              <li>Regular content audits to ensure outdated circulars are archived or updated.</li>
              <li>Zero tolerance for clickbait, unverified rumors, or misleading titles.</li>
            </ul>
          </section>

          {/* Disclaimer Note */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-950 space-y-2">
            <h3 className="font-ui font-semibold text-sm">
              Non-Governmental Identity
            </h3>
            <p className="text-xs leading-relaxed text-amber-900">
              Shasnadeshupdates.com is a privately managed news and educational portal. We do not represent any government body or ministry. For official procedures, official gazettes, or legal matters, readers are encouraged to consult official government departments directly.
            </p>
          </section>

          {/* Contact Support */}
          <section className="space-y-2 pt-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Get in Touch
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              We welcome feedback, suggestions, and corrections from our readers. For editorial inquiries or content suggestions, reach us at:{" "}
              <a href="mailto:shasnadeshupdates@gmail.com" className="text-saffron-600 font-medium underline">
                shasnadeshupdates@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
