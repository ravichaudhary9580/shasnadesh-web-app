const { transliterate } = require('transliteration');

const hindiTitle = "डिजिटल ठगी से बचाव upi online banking";
const englishSlug = transliterate(hindiTitle);

console.log("Original:", hindiTitle);
console.log("Transliterated:", englishSlug);
