import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">About Us</h1>
        <p className="mt-4 text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
          Shasnadeshupdates.com is a focused platform for government orders, circulars, and
          public updates. Our goal is to make official information easy to find, simple to
          understand, and accessible from any device.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="bg-white border border-ink-100 rounded-xl p-4">
            <h2 className="font-ui font-semibold text-ink-900 text-sm">What we publish</h2>
            <ul className="mt-2 text-ink-600 text-sm list-disc list-inside space-y-1">
              <li>Latest government orders and updates</li>
              <li>Department-wise notices and circulars</li>
              <li>Important schemes and public programs</li>
            </ul>
          </div>
          <div className="bg-white border border-ink-100 rounded-xl p-4">
            <h2 className="font-ui font-semibold text-ink-900 text-sm">Why it matters</h2>
            <ul className="mt-2 text-ink-600 text-sm list-disc list-inside space-y-1">
              <li>Faster access to official information</li>
              <li>Clear categorization for easy browsing</li>
              <li>Mobile-friendly for on-the-go reading</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-ink-600 font-ui text-sm leading-relaxed">
          Have suggestions or want to collaborate? Reach us anytime through our social
          channels listed in the footer.
        </p>
      </main>
    </div>
  );
}
