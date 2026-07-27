const { transliterate } = require('transliteration');

module.exports = (text) => {
  if (!text) return '';
  const transliterated = transliterate(text);
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
};