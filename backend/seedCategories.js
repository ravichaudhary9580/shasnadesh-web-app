require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Blog = require("./models/Blog");

const CATEGORIES = [
  "up-government",
  "education",
  "vacancy",
  "scholarship",
  "praroop",
  "other"
];

const categoryTitles = {
  "up-government": ["उत्तर प्रदेश सरकार का नया आदेश", "यूपी कैबिनेट का अहम फैसला", "शासनादेश जारी", "कर्मचारियों के लिए अच्छी खबर", "यूपी में नई योजना"],
  "education": ["शिक्षा विभाग का नया सर्कुलर", "स्कूलों के लिए जारी निर्देश", "शिक्षकों की भर्ती प्रक्रिया", "बोर्ड परीक्षा तिथियां घोषित", "नई शिक्षा नीति 2020"],
  "vacancy": ["सरकारी नौकरी 2026", "हजारों पदों पर बंपर भर्ती", "रेलवे भर्ती बोर्ड का नोटिफिकेशन", "शिक्षक भर्ती विज्ञापन जारी", "पुलिस विभाग में नई भर्तियां"],
  "scholarship": ["छात्रवृत्ति फॉर्म 2026", "स्कालरशिप वितरण शुरू", "छात्रों के खाते में आई स्कॉलरशिप", "स्कॉलरशिप स्टेटस कैसे चेक करें", "अल्पसंख्यक छात्रवृत्ति"],
  "praroop": ["छुट्टी का आवेदन प्रारूप", "स्थानांतरण हेतु प्रारूप", "मेडिकल अवकाश प्रार्थना पत्र", "वेतन वृद्धि हेतु प्रारूप", "शिकायती पत्र का प्रारूप"],
  "other": ["महत्वपूर्ण सूचना", "सामान्य जानकारी", "आज की मुख्य खबरें", "सरकारी अपडेट्स", "अन्य विशेष समाचार"]
};

// ... copy generator bits
const hindiParas = [
  "भारत एक विविधतापूर्ण देश है। इसकी सांस्कृतिक विरासत हज़ारों साल पुरानी है। यहाँ विभिन्न प्रांतीय भाषाएँ, रीति-रिवाज, वेशभूषा और खान-पान देखने को मिलते हैं।",
  "तकनीकी प्रगति ने हमारे जीवन के हर पहलू को बदल दिया है। सुबह उठने से लेकर रात सोने तक, हम किसी न किसी रूप में गैजेट्स और इंटरनेट पर निर्भर हैं।",
  "पर्यावरण का संतुलन बनाए रखना अब सिर्फ एक सैद्धांतिक विषय नहीं बल्कि हमारे अस्तित्व की जरूरत बन गया है। जलवायु परिवर्तन के कारण मौसम के मिजाज में आ रहे अप्रत्याशित बदलाव इसका प्रत्यक्ष प्रमाण हैं।",
  "यहाँ शासन द्वारा जारी आदेश के मुख्य बिंदु प्रस्तुत किए जा रहे हैं। कर्मचारियों को निर्देशित किया जाता है कि वे इन नियमों का कड़ाई से पालन करें।",
  "यह निर्णय आगामी वित्त वर्ष से लागू होगा। सभी संबंधित अधिकारियों को इस विषय में आवश्यक कार्यवाही करने के निर्देश दिए गए हैं।"
];

const generateContent = (idx) => {
  let html = "<h2>प्रस्तावना</h2>";
  html += `<p>${hindiParas[Math.floor(Math.random() * hindiParas.length)]}</p>`;
  html += `<p><img src="https://picsum.photos/seed/${idx * 100}/800/400" alt="Random Image" class="rounded-xl my-4 w-full object-cover aspect-video" /></p>`;
  html += `<h2>मुख्य बिंदु</h2>`;
  html += `<ul><li>प्रथम महत्वपूर्ण बिंदु</li><li>द्वितीय आवश्यक निर्देश</li><li>अंतिम निर्णय</li></ul>`;
  html += `<p>${hindiParas[Math.floor(Math.random() * hindiParas.length)]}</p>`;
  return html;
};

const seedCategories = async () => {
  try {
    await connectDB();
    console.log("Connected to DB...");

    const blogsToInsert = [];
    
    // Create 10 blogs for each of the 6 categories
    for (const cat of CATEGORIES) {
      for (let i = 1; i <= 10; i++) {
        const titleArr = categoryTitles[cat];
        const randomTitle = titleArr[Math.floor(Math.random() * titleArr.length)];
        const title = `${randomTitle} - अपडेट ${i}`;
        
        // Simple slug: category + timestamp + i
        const baseSlug = `${cat}-blog-${Date.now()}-${i}`;
        const excerpt = "यह एक विस्तृत लेख है जिसमें विभिन्न महत्वपूर्ण पहलुओं और वर्तमान स्थिति का गहन विश्लेषण किया गया है।";
        
        blogsToInsert.push({
          title,
          slug: baseSlug,
          content: generateContent(i),
          excerpt,
          category: cat,
          tags: [cat, "update", "news"],
          status: "published",
          views: Math.floor(Math.random() * 500) + 10,
          thumbnail: `https://picsum.photos/seed/${cat}-${i}/800/400`,
        });
      }
    }

    await Blog.insertMany(blogsToInsert);
    console.log(`Successfully seeded ${blogsToInsert.length} blogs!`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedCategories();
