import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col justify-between">
      <SEO 
        title="Privacy Policy - Shasnadesh Updates"
        description="Privacy policy for Shasnadeshupdates.com. Learn about how we collect, use, and protect data, cookie policy, Google AdSense disclosures, and third-party advertising."
        url="https://shasnadeshupdates.com/privacy-policy"
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex-1">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs font-ui text-ink-400">
              Last updated: August 7, 2026
            </p>
          </div>

          <p className="text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
            At <strong>Shasnadeshupdates.com</strong>, available from https://shasnadeshupdates.com,
            one of our main priorities is the privacy of our visitors. This Privacy Policy document contains
            types of information that is collected and recorded by Shasnadeshupdates.com and how we use it.
          </p>

          {/* Log Files */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              1. Log Files
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Shasnadeshupdates.com follows a standard procedure of using log files. These files log visitors
              when they visit websites. All hosting companies do this as part of hosting services analytics.
              The information collected by log files includes internet protocol (IP) addresses, browser type,
              Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
              These are not linked to any information that is personally identifiable. The purpose of the information
              is for analyzing trends, administering the site, tracking users movement on the website, and gathering demographic information.
            </p>
          </section>

          {/* Cookies & Web Beacons */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              2. Cookies & Web Beacons
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Like any other website, Shasnadeshupdates.com uses cookies. These cookies are used to store information
              including visitors preferences, and the pages on the website that the visitor accessed or visited.
              The information is used to optimize the users experience by customizing our web page content based on
              visitors browser type and/or other information.
            </p>
          </section>

          {/* Google DoubleClick DART Cookie & AdSense Policies */}
          <section className="space-y-3 bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-amber-950">
              3. Google DoubleClick DART Cookie & Google AdSense Policies
            </h2>
            <p className="text-amber-900 font-ui text-sm leading-relaxed">
              Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads
              to our site visitors based upon their visit to www.website.com and other sites on the internet.
            </p>
            <ul className="list-disc list-inside text-amber-900 font-ui text-sm space-y-2 mt-2">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.
              </li>
              <li>
                Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to your sites and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting{" "}
                <a 
                  href="https://adssettings.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline text-amber-950 hover:text-saffron-600"
                >
                  Google Ads Settings
                </a>. Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{" "}
                <a 
                  href="https://www.aboutads.info" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline text-amber-950 hover:text-saffron-600"
                >
                  www.aboutads.info
                </a>.
              </li>
            </ul>
          </section>

          {/* Advertising Partners */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              4. Our Advertising Partners
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Some of advertisers on our site may use cookies and web beacons. Our advertising partners include:
            </p>
            <ul className="list-disc list-inside text-ink-600 font-ui text-sm space-y-1 pl-2">
              <li><strong>Google AdSense</strong> (https://policies.google.com/technologies/ads)</li>
            </ul>
            <p className="text-ink-600 font-ui text-sm leading-relaxed mt-2">
              Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used
              in their respective advertisements and links that appear on Shasnadeshupdates.com, which are sent directly to
              users browser. They automatically receive your IP address when this occurs. These technologies are used to measure
              the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on
              websites that you visit.
            </p>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Note that Shasnadeshupdates.com has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </section>

          {/* Third Party Privacy Policies */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              5. Third Party Privacy Policies
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Shasnadeshupdates.com's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising
              you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.
              It may include their practices and instructions about how to opt-out of certain options.
            </p>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              You can choose to disable cookies through your individual browser options. To know more detailed information
              about cookie management with specific web browsers, it can be found at the browsers respective websites.
            </p>
          </section>

          {/* Children's Information */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              6. Children's Information (COPPA)
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Another part of our priority is adding protection for children while using the internet. We encourage parents
              and guardians to observe, participate in, and/or monitor and guide their online activity.
            </p>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              Shasnadeshupdates.com does not knowingly collect any Personal Identifiable Information from children under the
              age of 13. If you think that your child provided this kind of information on our website, we strongly encourage
              you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
            </p>
          </section>

          {/* Online Privacy Policy Only */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              7. Online Privacy Policy Only
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to
              the information that they shared and/or collect in Shasnadeshupdates.com. This policy is not applicable to any
              information collected offline or via channels other than this website.
            </p>
          </section>

          {/* Contact Us */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              8. Contact Us
            </h2>
            <p className="text-ink-600 font-ui text-sm leading-relaxed">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at:{" "}
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
