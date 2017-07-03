const fs = require('fs');
function getSamplePayload(provider, type) {
  const filename = __dirname + '/test-payloads/' + provider + '-' + type + '.json';
  const buffer = fs.readFileSync(filename);
  return JSON.parse(buffer.toString());
}

module.exports = {
  getSamplePayload
};