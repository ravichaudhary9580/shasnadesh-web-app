const slugify = require('slugify');

const text = "डिजिटल ठगी से बचाव upi online banking";

const slug = slugify(text, { lower: true, strict: true });

console.log("Original:", text);
console.log("Slug:", slug);
