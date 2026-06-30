module.exports = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}\-]+/gu, '')
    .replace(/\-\-+/g, '-')
}