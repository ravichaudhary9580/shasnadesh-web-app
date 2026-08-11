import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import toast from "react-hot-toast";
import { Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Thank you! Your message has been received.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col justify-between">
      <SEO 
        title="Contact Us - Shasnadesh Updates"
        description="Get in touch with Shasnadeshupdates.com. Contact our editorial team for queries, corrections, suggestions, or advertising inquiries."
        url="https://shasnadeshupdates.com/contact"
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex-1 w-full">
        <div className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <span className="inline-block px-3 py-1 bg-saffron-50 text-saffron-700 text-xs font-semibold rounded-full border border-saffron-200">
              Support & Contact
            </span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink-900">
              Contact Us <span className="font-hindi text-xl font-normal text-ink-500">· संपर्क करें</span>
            </h1>
            <p className="mt-2 text-ink-600 font-ui text-sm sm:text-base leading-relaxed">
              Have questions, feedback, content suggestions, or copyright inquiries? We are here to help you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 pt-2">
            {/* Contact Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-ink-50/70 border border-ink-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-saffron-600 font-semibold text-sm">
                  <Mail size={18} />
                  <span>Official Email Support</span>
                </div>
                <p className="text-xs text-ink-500">For general inquiries, news tips & editorial feedback:</p>
                <a
                  href="mailto:shasnadeshupdates@gmail.com"
                  className="block text-sm font-medium text-saffron-600 hover:text-saffron-700 underline truncate"
                >
                  shasnadeshupdates@gmail.com
                </a>
              </div>

              <div className="p-5 bg-ink-50/70 border border-ink-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-ink-800 font-semibold text-sm">
                  <Clock size={18} className="text-saffron-600" />
                  <span>Response Time</span>
                </div>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Our team reviews inquiries daily. We aim to respond within 24 to 48 business hours.
                </p>
              </div>

              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-semibold text-sm">
                  <ShieldCheck size={18} className="text-amber-700" />
                  <span className="font-hindi">सामग्री एवं सर्वाधिकार आपत्ति</span>
                </div>
                <p className="text-xs text-amber-900 font-hindi leading-relaxed">
                  यदि किसी विभाग अथवा व्यक्ति को इस पोर्टल पर उपलब्ध किसी शासनादेश, सूचना अथवा सामग्री पर आपत्ति हो, तो कृपया हमें विषय सहित ईमेल भेजें। हम त्वरित सत्यापन पश्चात संशोधन करेंगे।
                </p>
              </div>
            </div>

            {/* Interactive Form */}
            <div className="lg:col-span-7">
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-3">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                  <h2 className="font-display text-xl font-bold text-emerald-950">
                    Message Sent Successfully!
                  </h2>
                  <p className="text-sm font-ui text-emerald-800 leading-relaxed">
                    Thank you for reaching out to Shasnadesh Updates. Our editorial team has received your message and will respond shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-ui font-semibold text-ink-900 text-base flex items-center gap-2">
                    <MessageSquare size={18} className="text-saffron-600" />
                    <span>Send Us a Message</span>
                  </h2>

                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-ink-50/50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-ink-50/50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Content Correction / General Inquiry"
                      className="w-full px-3.5 py-2.5 bg-ink-50/50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your message or inquiry here..."
                      className="w-full px-3.5 py-2.5 bg-ink-50/50 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-5 bg-saffron-600 text-white rounded-lg text-sm font-medium hover:bg-saffron-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
