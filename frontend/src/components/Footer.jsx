import { Link } from "react-router-dom";
const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: "https://wa.me/919876543210", // Replace with your actual WhatsApp number
    viewBox: "0 0 24 24",
    path: "M16.72 13.2c-.25-.13-1.46-.72-1.69-.8-.23-.08-.4-.13-.57.13-.17.25-.65.8-.8.97-.15.17-.3.2-.55.07-.25-.13-1.07-.39-2.03-1.25-.75-.66-1.25-1.47-1.4-1.72-.15-.25-.02-.39.11-.52.11-.11.25-.3.37-.45.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.07-.13-.57-1.37-.78-1.88-.2-.48-.4-.41-.57-.42h-.49c-.17 0-.45.07-.68.32-.23.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.8 2.74 4.35 3.85.6.26 1.07.41 1.44.52.6.19 1.14.16 1.57.1.48-.07 1.46-.6 1.66-1.17.2-.57.2-1.05.14-1.16-.05-.11-.22-.18-.47-.3Zm-4.7 7.3a8.6 8.6 0 0 1-4.37-1.2l-.31-.18-3.2.84.85-3.12-.2-.32A8.6 8.6 0 1 1 20.6 12a8.6 8.6 0 0 1-8.58 8.5Zm0-18A9.9 9.9 0 0 0 3.1 15.68L2 19.9l4.32-1.13A9.9 9.9 0 1 0 12 2.5Z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/183kRbiM23/",
    viewBox: "0 0 24 24",
    path: "M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V12H8v3h2v6h3v-6h2.4l.6-3H13v-2.1c0-.5.4-.9.9-.9Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/shasnadeshupdates?igsh=MWU5ajg4ejR6NWpycQ==",
    viewBox: "0 0 24 24",
    path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm6.2-.9a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@shasnadeshupdates", // Replace with your actual YouTube channel
    viewBox: "0 0 24 24",
    path: "M22 12.2c0-1.4-.2-2.9-.6-4.3a2.8 2.8 0 0 0-2-2c-1.7-.4-4.3-.6-7.4-.6s-5.7.2-7.4.6a2.8 2.8 0 0 0-2 2C2.2 9.3 2 10.8 2 12.2c0 1.4.2 2.9.6 4.3a2.8 2.8 0 0 0 2 2c1.7.4 4.3.6 7.4.6s5.7-.2 7.4-.6a2.8 2.8 0 0 0 2-2c.4-1.4.6-2.9.6-4.3Zm-12 3.3V8.9l6 3.3-6 3.3Z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/shasnadeshupdates", // Replace with your actual LinkedIn
    viewBox: "0 0 24 24",
    path: "M6.5 9.5h-3v10h3v-10Zm-1.5-4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM20.5 13.7c0-2.6-1.4-3.8-3.3-3.8-1.5 0-2.2.8-2.6 1.4h0v-1.2h-3v10h3v-5.6c0-1.5.3-2.9 2.1-2.9 1.7 0 1.7 1.6 1.7 3v5.5h3v-6.4Z",
  },
  {
    label: "Telegram",
    href: "https://t.me/shasnadeshupdates", // Replace with your actual Telegram channel
    viewBox: "0 0 24 24",
    path: "M21.9 4.6 19.3 19a2 2 0 0 1-3.1 1.2l-4.6-3.4-2.2 2.1c-.2.2-.4.3-.7.3l.3-4.9L17 7.7c.4-.3-.1-.5-.5-.3l-9.7 6-4.2-1.3a1.7 1.7 0 0 1 .1-3.2l16.4-4.8a1.3 1.3 0 0 1 1.8 1.5Z",
  },
  {
    label: "X",
    href: "https://twitter.com/shasnadeshupdates", // Replace with your actual X/Twitter
    viewBox: "0 0 24 24",
    path: "M18.2 3h2.8l-6.1 7 7.1 11h-5.6l-4.4-6.2L6.6 21H3.8l6.5-7.4L3 3h5.7l4 5.6L18.2 3Zm-1 16h1.6L8.7 5H7.1l10.1 14Z",
  },
];

export default function Footer({ variant = "wide" }) {
  const containerClass = variant === "narrow" ? "max-w-3xl" : "max-w-6xl";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 py-8">
      <div className={`${containerClass} mx-auto px-4 sm:px-6`}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              to="/about"
              className="text-ink-500 hover:text-saffron-600 transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-ink-500 hover:text-saffron-600 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/disclaimer"
              className="text-ink-500 hover:text-saffron-600 transition-colors"
            >
              Disclaimer
            </Link>
            <Link
              to="/privacy-policy"
              className="text-ink-500 hover:text-saffron-600 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, viewBox, path }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-ink-100 text-ink-500 hover:text-saffron-600 hover:border-saffron-200 hover:bg-saffron-50 transition-colors flex items-center justify-center"
              >
                <svg
                  viewBox={viewBox}
                  className="w-4 h-4"
                  aria-hidden="true"
                  focusable="false"
                  fill="currentColor"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>

          <div className="space-y-1">
            <p className="font-hindi text-ink-400 text-sm">सत्यमेव जयते · Satyameva Jayate</p>
            <p className="font-ui text-xs text-ink-300">© {year} Shasnadeshupdates.com</p>
            <p className="font-ui text-xs text-ink-300">
              Designed by{" "}
              <a
                href="https://bharatwebservices.live/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
              >
                dev
              </a>
              .
              <a
                href="https://ravichaudhary9580.github.io/Portfolio-New/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
              >
                ravi
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
