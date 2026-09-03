const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    path: 'about',
    canonical: 'https://shasnadeshupdates.com/about',
    title: 'About Us - Shasnadesh Updates | हमारे बारे में',
    description: 'Learn about Shasnadeshupdates.com, our mission, editorial standards, verification process for government circulars, and our commitment to public information.',
    heading: 'About Shasnadesh Updates (हमारे बारे में)',
    bodyHtml: `
      <h2>हमारा उद्देश्य (Our Mission)</h2>
      <p>सरकारी आदेश (शासन-आदेश / Circulars) एवं सरकारी योजनाएं आम जनता, कर्मचारियों, छात्रों एवं नौकरी चाहने वालों के लिए अत्यंत महत्वपूर्ण हैं। Shasnadesh Updates का उद्देश्य सभी आधिकारिक शासनादेशों, भर्ती सूचनाओं एवं लोक कल्याणकारी योजनाओं को सरल, पारदर्शी एवं सत्यापित रूप में हिंदी और अंग्रेजी में उपलब्ध कराना है।</p>
      <h2>सत्यापन और विश्वसनीयता (Verification & Authenticity)</h2>
      <p>हमारे पोर्टल पर प्रकाशित प्रत्येक शासनादेश और सूचना सीधे संबंधित विभाग के आधिकारिक पोर्टल से सत्यापित की जाती है। हम पाठकों की सुविधा के लिए मूल शासनादेश की PDF कॉपी भी संलग्न करते हैं ताकि प्रामाणिकता बनी रहे।</p>
      <h2>संपादकीय टीम (Editorial Standards)</h2>
      <p>हमारी संपादकीय टीम निष्पक्षता, तथ्यात्मकता और पारदर्शिता के सिद्धांतों पर काम करती है। हम किसी भी राजनीतिक दल या सरकारी संस्था से संबद्ध नहीं हैं; यह एक स्वतंत्र सूचनात्मक पोर्टल है।</p>
    `
  },
  {
    path: 'contact',
    canonical: 'https://shasnadeshupdates.com/contact',
    title: 'Contact Us - Shasnadesh Updates | संपर्क करें',
    description: 'Get in touch with Shasnadeshupdates.com. Contact our editorial team for queries, corrections, suggestions, or advertising inquiries.',
    heading: 'Contact Us (संपर्क करें)',
    bodyHtml: `
      <h2>हमसे संपर्क करें (Get in Touch)</h2>
      <p>यदि आपके पास किसी शासनादेश, सूचना या योजना से संबंधित कोई प्रश्न, सुझाव या संशोधन है, तो आप हमारी संपादकीय टीम से संपर्क कर सकते हैं।</p>
      <p><strong>ईमेल:</strong> contact@shasnadeshupdates.com</p>
      <p><strong>आधिकारिक वेबसाइट:</strong> <a href="https://shasnadeshupdates.com/">https://shasnadeshupdates.com</a></p>
      <h2>प्रतिक्रिया और सुधार (Feedback & Corrections)</h2>
      <p>हम सूचना की सटीकता को सर्वोच्च प्राथमिकता देते हैं। यदि आपको किसी लेख में कोई त्रुटि या अद्यतन की आवश्यकता दिखाई दे, तो कृपया तुरंत हमें सूचित करें।</p>
    `
  },
  {
    path: 'privacy-policy',
    canonical: 'https://shasnadeshupdates.com/privacy-policy',
    title: 'Privacy Policy - Shasnadesh Updates | गोपनीयता नीति',
    description: 'Privacy policy for Shasnadeshupdates.com. Learn about how we collect, use, and protect data, cookie policy, Google AdSense disclosures, and third-party advertising.',
    heading: 'Privacy Policy (गोपनीयता नीति)',
    bodyHtml: `
      <h2>Privacy Policy for Shasnadesh Updates</h2>
      <p>At Shasnadeshupdates.com, accessible from https://shasnadeshupdates.com, the privacy of our visitors is of extreme importance to us. This Privacy Policy document outlines the types of personal information that is received and collected and how it is used.</p>
      <h2>Log Files and Analytics</h2>
      <p>Like many other websites, Shasnadeshupdates.com makes use of log files and privacy-friendly analytics to analyze trends, administer the site, track user movement around the site, and gather demographic information.</p>
      <h2>Cookies and Web Beacons</h2>
      <p>We use cookies to store information about visitors preferences, record user-specific information on which pages the user access or visit, and customize Web page content based on visitors browser type or other information that the visitor sends via their browser.</p>
      <h2>Google DoubleClick DART Cookie & AdSense</h2>
      <p>Google, as a third party vendor, uses cookies to serve ads on Shasnadeshupdates.com. Users may opt out of personalized advertising by visiting Google Ads Settings.</p>
    `
  },
  {
    path: 'terms',
    canonical: 'https://shasnadeshupdates.com/terms',
    title: 'Terms & Conditions - Shasnadesh Updates | नियम और शर्तें',
    description: 'Terms and conditions for accessing and using Shasnadeshupdates.com, outlining user responsibilities, copyright guidelines, and platform policies.',
    heading: 'Terms & Conditions (नियम और शर्तें)',
    bodyHtml: `
      <h2>Terms and Conditions of Use</h2>
      <p>By accessing this website at https://shasnadeshupdates.com, you are agreeing to be bound by these website Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
      <h2>Use License & Informational Purpose</h2>
      <p>The materials on Shasnadeshupdates.com are provided for general informational and educational purposes only. While we make every effort to provide accurate summaries of government circulars, official gazettes and department notices remain the final legal authority.</p>
      <h2>Disclaimer</h2>
      <p>Shasnadesh Updates is an independent news and public information portal and is not operated by, directly affiliated with, or endorsed by any government agency or ministry.</p>
    `
  },
  {
    path: 'disclaimer',
    canonical: 'https://shasnadeshupdates.com/disclaimer',
    title: 'Disclaimer (अस्वीकरण) - Shasnadesh Updates',
    description: 'Disclaimer and source notices for Shasnadeshupdates.com. Shasnadesh Updates is an independent informational portal and not affiliated with any government body.',
    heading: 'Disclaimer (अस्वीकरण)',
    bodyHtml: `
      <h2>अस्वीकरण / Non-Government Affiliation Disclaimer</h2>
      <p><strong>Shasnadesh Updates (shasnadeshupdates.com)</strong> एक स्वतंत्र निजी सूचनात्मक पोर्टल है। यह किसी भी केंद्र सरकार, राज्य सरकार, विभाग या मंत्रालय की आधिकारिक वेबसाइट नहीं है।</p>
      <p>हमारा उद्देश्य केवल विभिन्न सरकारी विभागों द्वारा सार्वजनिक रूप से जारी किए गए शासनादेशों, अधिसूचनाओं और योजनाओं की जानकारी को आम नागरिकों और कर्मचारियों तक सरल भाषा में पहुंचाना है।</p>
      <h2>आधिकारिक स्रोतों की पुष्टि (Official Source Notice)</h2>
      <p>पाठकों को सलाह दी जाती है कि किसी भी निर्णय या आवेदन से पूर्व संबंधित विभाग की आधिकारिक वेबसाइट (जैसे shasanadesh.up.gov.in) पर जाकर मूल शासनादेश का अवलोकन अवश्य करें।</p>
    `
  }
];

function generatePages() {
  const publicDir = path.join(__dirname, '../public');
  const buildDir = path.join(__dirname, '../build');
  const baseTemplatePath = fs.existsSync(path.join(buildDir, 'index.html'))
    ? path.join(buildDir, 'index.html')
    : path.join(publicDir, 'index.html');

  if (!fs.existsSync(baseTemplatePath)) {
    console.error('Base template not found at:', baseTemplatePath);
    return;
  }

  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');

  PAGES.forEach((page) => {
    let html = baseHtml;

    // 1. Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`);

    // 2. Replace meta description
    if (html.includes('name="description"')) {
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${page.description}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${page.description}" />\n</head>`);
    }

    // 3. Inject strict, exact Canonical link for this page
    const canonicalTag = `  <!-- Strict Canonical for ${page.path} -->\n  <link rel="canonical" href="${page.canonical}" />\n  <link rel="alternate" hreflang="hi" href="${page.canonical}" />\n  <link rel="alternate" hreflang="en" href="${page.canonical}" />\n  <link rel="alternate" hreflang="x-default" href="${page.canonical}" />\n`;
    
    // Remove any leftover canonical in template
    html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/gi, '');
    html = html.replace(/<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*\/?>/gi, '');
    
    // Inject right before </head>
    html = html.replace('</head>', `${canonicalTag}</head>`);

    // 4. Update OpenGraph & Twitter tags
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${page.title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${page.description}" />`);
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${page.canonical}" />`);
    html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${page.title}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${page.description}" />`);
    html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:url" content="${page.canonical}" />`);

    // 5. Replace noscript with page specific rich content
    const noscriptContent = `
    <noscript>
      <header style="background: #ffffff; border-bottom: 1px solid #e2dcd5; padding: 16px 20px; text-align: center;">
        <h1 style="color: #e8920a; margin: 0; font-size: 24px;">${page.heading}</h1>
        <p style="color: #666; margin: 4px 0 0; font-size: 14px;">Shasnadesh Updates - आधिकारिक सूचना एवं शासनादेश पोर्टल</p>
      </header>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 24px; background: #ffffff; border: 1px solid #e2dcd5; border-radius: 8px; line-height: 1.7;">
        ${page.bodyHtml}
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px;">
          <a href="https://shasnadeshupdates.com/" style="color: #e8920a; font-weight: 600; text-decoration: none;">होमपेज (Home)</a> |
          <a href="https://shasnadeshupdates.com/about" style="color: #e8920a; font-weight: 600; text-decoration: none;">About Us</a> |
          <a href="https://shasnadeshupdates.com/contact" style="color: #e8920a; font-weight: 600; text-decoration: none;">Contact Us</a> |
          <a href="https://shasnadeshupdates.com/privacy-policy" style="color: #e8920a; font-weight: 600; text-decoration: none;">Privacy Policy</a> |
          <a href="https://shasnadeshupdates.com/terms" style="color: #e8920a; font-weight: 600; text-decoration: none;">Terms</a> |
          <a href="https://shasnadeshupdates.com/disclaimer" style="color: #e8920a; font-weight: 600; text-decoration: none;">Disclaimer</a>
        </div>
      </div>
    </noscript>`;

    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptContent);

    // Save to public/<path>/index.html
    const publicTargetDir = path.join(publicDir, page.path);
    if (!fs.existsSync(publicTargetDir)) fs.mkdirSync(publicTargetDir, { recursive: true });
    fs.writeFileSync(path.join(publicTargetDir, 'index.html'), html);

    // If build dir exists, also save to build/<path>/index.html
    if (fs.existsSync(buildDir)) {
      const buildTargetDir = path.join(buildDir, page.path);
      if (!fs.existsSync(buildTargetDir)) fs.mkdirSync(buildTargetDir, { recursive: true });
      fs.writeFileSync(path.join(buildTargetDir, 'index.html'), html);
    }

    console.log(`✅ Generated static HTML for: /${page.path} -> ${page.canonical}`);
  });

  // Also ensure homepage build/index.html (if in build dir) has its canonical
  if (fs.existsSync(buildDir)) {
    const buildIndexPath = path.join(buildDir, 'index.html');
    let buildIndexHtml = fs.readFileSync(buildIndexPath, 'utf8');
    if (!buildIndexHtml.includes('rel="canonical"')) {
      buildIndexHtml = buildIndexHtml.replace(
        '</head>',
        '  <link rel="canonical" href="https://shasnadeshupdates.com/" />\n</head>'
      );
      fs.writeFileSync(buildIndexPath, buildIndexHtml);
      console.log('✅ Injected homepage canonical into build/index.html');
    }
  }
}

generatePages();
