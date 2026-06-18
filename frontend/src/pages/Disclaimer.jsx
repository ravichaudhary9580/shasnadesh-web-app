import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
          Disclaimer <span className="font-hindi">अस्वीकरण</span>
        </h1>

        <section className="mt-6 space-y-4">
          <p className="text-ink-700 font-hindi text-sm sm:text-base leading-relaxed">
            Shasnadeshupdates (shasnadeshupdates.com) एक स्वतंत्र सूचना मंच है। इस वेबसाइट/ऐप पर प्रकाशित शासनादेश, अधिसूचनाएँ, कार्यालय आदेश, परिपत्र एवं अन्य सरकारी दस्तावेज विभिन्न सरकारी विभागों एवं उनकी आधिकारिक वेबसाइटों से प्राप्त सार्वजनिक सूचनाओं पर आधारित हैं।
          </p>
          <p className="text-ink-700 font-hindi text-sm sm:text-base leading-relaxed">
            हम किसी भी सरकारी विभाग, मंत्रालय अथवा उत्तर प्रदेश सरकार से संबद्ध या अधिकृत संस्था नहीं हैं।
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-hindi font-semibold text-ink-900 text-base sm:text-lg">सूचना की प्रकृति</h2>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            शासनादेशों का सारांश, व्याख्या एवं सरल भाषा में प्रस्तुत जानकारी केवल पाठकों की सुविधा हेतु दी जाती है। किसी भी कानूनी, प्रशासनिक अथवा आधिकारिक निर्णय के लिए संबंधित विभाग द्वारा जारी मूल शासनादेश एवं आधिकारिक अभिलेख को ही अंतिम एवं मान्य माना जाएगा।
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="font-hindi font-semibold text-ink-900 text-base sm:text-lg">सीमित उत्तरदायित्व</h2>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            वेबसाइट पर उपलब्ध जानकारी की शुद्धता सुनिश्चित करने का प्रयास किया जाता है, किन्तु किसी त्रुटि, परिवर्तन या विलंब के लिए वेबसाइट उत्तरदायी नहीं होगी।
          </p>
        </section>

        <section className="mt-8 space-y-3 border-t pt-6 border-ink-200">
          <h2 className="font-ui font-semibold text-ink-900 text-base sm:text-lg">Source Notice</h2>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            इस वेबसाइट पर प्रकाशित शासनादेश एवं सरकारी दस्तावेज संबंधित विभागों की आधिकारिक वेबसाइटों से प्राप्त सार्वजनिक अभिलेख हैं।
          </p>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            प्रत्येक दस्तावेज के साथ उसका मूल स्रोत (Official Source) उपलब्ध कराया जाता है। दस्तावेजों के साथ प्रकाशित सारांश, लेख, विश्लेषण एवं सरल भाषा में दी गई जानकारी Shasnadeshupdates द्वारा तैयार की गई मौलिक सामग्री है।
          </p>
          <p className="text-ink-600 font-hindi text-sm leading-relaxed">
            यदि किसी विभाग, संस्था अथवा अधिकारधारी को किसी सामग्री पर आपत्ति हो तो वे हमसे संपर्क कर सकते हैं। उचित सत्यापन के उपरांत आवश्यक कार्रवाई की जाएगी।
          </p>
        </section>
      </main>
      <Footer variant="narrow" />
    </div>
  );
}
