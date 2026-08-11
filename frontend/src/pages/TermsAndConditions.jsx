import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col justify-between">
      <SEO 
        title="Terms & Conditions - Shasnadesh Updates"
        description="Terms and conditions for using Shasnadeshupdates.com. Please read our terms of use, content policies, intellectual property rights, and user guidelines."
        url="https://shasnadeshupdates.com/terms"
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex-1">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
              Terms & Conditions
            </h1>
            <p className="mt-2 text-xs font-ui text-ink-400">
              Last updated: August 7, 2026
            </p>
          </div>

          <p className="text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
            Welcome to <strong>Shasnadeshupdates.com</strong>. By accessing or using our website,
            you agree to comply with and be bound by the following terms and conditions of use.
            If you disagree with any part of these terms, please do not use our website.
          </p>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              1. Acceptance of Terms
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              By visiting Shasnadeshupdates.com, you accept and agree to be bound by these Terms & Conditions
              and our Privacy Policy. These terms apply to all visitors, users, and others who access the website.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              2. Informational & Non-Governmental Disclaimer
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Shasnadeshupdates.com is an independent digital news and educational information portal.
              We are <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected
              with the Government of India, any State Government, or any official department/ministry</strong>.
              All government names, logos, titles, and order numbers mentioned on this site are used solely for informational,
              educational, and identification purposes.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              3. Intellectual Property Rights
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Unless otherwise stated, Shasnadeshupdates.com and/or its licensors own the intellectual property rights
              for all original content, layout, design, text, and graphics published on this website. You may view and print
              pages for personal, non-commercial use only.
            </p>
            <ul className="list-disc list-inside text-ink-600 font-ui text-sm space-y-1 pl-2">
              <li>Do not republish material from this site without prior written consent.</li>
              <li>Do not sell, rent, or sub-license material from the site.</li>
              <li>Do not reproduce, duplicate, or copy content for commercial exploitation.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              4. Accuracy of Information
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              While we strive to ensure that all information, circulars, and updates are accurate and up to date,
              Shasnadeshupdates.com makes no warranties or representations as to the accuracy, completeness, or timeliness
              of the content. Users are advised to verify details with official government gazettes, department portals,
              or official notifications before taking any official or legal action.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              5. Third-Party Links & Advertisements
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Our website may contain links to external third-party websites or display advertisements served by Google AdSense
              and other advertising networks. We have no control over the content, privacy policies, or practices of any
              third-party websites. Accessing external links is done at your own risk.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              6. Limitation of Liability
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              In no event shall Shasnadeshupdates.com, its owners, or team members be liable for any direct, indirect, incidental,
              consequential, or special damages arising out of or in connection with your use of this website or reliance on
              any information provided herein.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              7. Changes to Terms
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              We reserve the right to revise and modify these terms at any time without prior notice. By continuing to use the
              site after revisions become effective, you agree to be bound by the updated terms.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              8. Contact Information
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              If you have any questions regarding these Terms & Conditions, please contact us at:{" "}
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
