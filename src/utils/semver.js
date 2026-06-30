/**
 * Bump version string
 * bumpVersion('1.0', 'minor') => '1.1'
 * bumpVersion('1.1', 'major') => '2.0'
 */
function bumpVersion(current, type = 'minor') {
  const [major, minor] = current.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0`;
  return `${major}.${minor + 1}`;
}

module.exports = { bumpVersion };
