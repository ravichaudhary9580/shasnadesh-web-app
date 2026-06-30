const text = "डिजिटल ठगी से बचाव upi online banking";

const slug = text
  .toString()
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\p{L}\p{M}\p{N}\-]+/gu, '') // Keep letters (including Unicode), marks, numbers, and hyphens
  .replace(/\-\-+/g, '-');

console.log("Original:", text);
console.log("Slug:", slug);
