const escapeRegex = (value = '') => {
  const stringValue = typeof value === 'string' ? value : String(value);
  return stringValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
