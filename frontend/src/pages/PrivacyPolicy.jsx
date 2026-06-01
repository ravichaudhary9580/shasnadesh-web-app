import Navbar from "../components/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">Privacy Policy</h1>
        <p className="mt-4 text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
          This Privacy Policy explains how Shasnadeshupdates.com collects, uses, and protects
          your information when you use our website.
        </p>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">Information we collect</h2>
          <ul className="text-ink-600 text-sm list-disc list-inside space-y-1">
            <li>Basic usage data (pages visited, time on site)</li>
            <li>Device and browser information</li>
            <li>Optional information you share through our features</li>
          </ul>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">How we use information</h2>
          <ul className="text-ink-600 text-sm list-disc list-inside space-y-1">
            <li>Improve content quality and user experience</li>
            <li>Analyze performance and fix issues</li>
            <li>Send updates when you opt in</li>
          </ul>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">Cookies</h2>
          <p className="text-ink-600 text-sm leading-relaxed">
            We may use cookies to remember preferences and measure traffic. You can control
            cookies through your browser settings.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">Third-party services</h2>
          <p className="text-ink-600 text-sm leading-relaxed">
            We may use trusted third-party tools for analytics or performance. These tools
            follow their own privacy policies.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">Security</h2>
          <p className="text-ink-600 text-sm leading-relaxed">
            We take reasonable steps to protect your data.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-ui font-semibold text-ink-900 text-sm">Contact</h2>
          <p className="text-ink-600 text-sm leading-relaxed">
            For questions about this policy, contact us through the social links in the footer.
          </p>
        </section>
      </main>
    </div>
  );
}
