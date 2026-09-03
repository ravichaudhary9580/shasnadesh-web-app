const path = require("path");

// Generate static pre-rendered HTML for trust/policy pages (About, Contact, Terms, Privacy, Disclaimer)
try {
  console.log("Generating static HTML files for static trust pages...");
  require("./generateStaticPages");
} catch (err) {
  console.warn("Static page generation warning:", err.message);
}

process.exit(0);
