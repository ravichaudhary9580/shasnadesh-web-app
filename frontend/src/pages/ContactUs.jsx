import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
          Contact Us <span className="font-hindi">संपर्क करें</span>
        </h1>

        <section className="mt-6 space-y-4">
          <p className="text-ink-700 font-hindi text-sm sm:text-base leading-relaxed">
            Shasnadesh Updates से जुड़ने के लिए आप हमें निम्नलिखित माध्यमों से संपर्क कर सकते हैं:
          </p>
        </section>

        <section className="mt-8 space-y-4 bg-white rounded-lg p-6 shadow-sm border border-ink-100">
          <div>
            <h2 className="font-ui font-semibold text-ink-900 text-sm mb-2">Email</h2>
            <a 
              href="mailto:admin@shasnadeshupdates.com" 
              className="text-saffron-600 hover:text-saffron-700 text-sm transition-colors"
            >
              admin@shasnadeshupdates.com
            </a>
          </div>
          
          <div className="pt-4 border-t border-ink-100">
            <h2 className="font-hindi font-semibold text-ink-900 text-sm mb-2">सोशल मीडिया</h2>
            <p className="text-ink-600 font-hindi text-sm">
              आप हमारे सोशल मीडिया पेज पर भी जुड़ सकते हैं। लिंक पेज के नीचे फुटर में उपलब्ध हैं।
            </p>
          </div>
        </section>

        <section className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <h2 className="font-hindi font-semibold text-ink-900 text-base mb-3">कॉपीराइट एवं सामग्री आपत्ति</h2>
          <p className="text-ink-700 font-hindi text-sm leading-relaxed">
            यदि किसी सरकारी विभाग, संस्था अथवा कॉपीराइट अधिकारधारी को वेबसाइट पर उपलब्ध किसी सामग्री के संबंध में कोई आपत्ति हो, तो कृपया हमें ईमेल करें। सत्यापन के बाद आवश्यक संशोधन अथवा सामग्री हटाने की कार्रवाई की जाएगी।
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-hindi font-semibold text-ink-900 text-base">प्रतिक्रिया समय</h2>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            हम आपके संदेशों का उत्तर देने का प्रयास 48-72 घंटों के भीतर करते हैं।
          </p>
        </section>

        <section className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-ink-700 font-hindi text-sm text-center">
            🙏 आपके सुझाव एवं प्रतिक्रिया हमारे लिए महत्वपूर्ण हैं।
          </p>
        </section>
      </main>
      <Footer variant="narrow" />
    </div>
  );
}
