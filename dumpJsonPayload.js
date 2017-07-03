const fs = require('fs');
const jsonFolder = __dirname + '/json';
const payloadsFolder = jsonFolder + '/payloads';

/**
 * Get current timestamp
 */
function getTimestamp() {
  return ((new Date()).getTime() / 1000).toString(36);
}

/**
 * Get payload filename
 */
function getPayloadFilename(provider) {
  return payloadsFolder + '/payload-' + provider + '-' + getTimestamp() + '.json';
}

/**
 * Dump JSON payload to file
 */
function dumpJsonPayload(provider, payload) {
  // Store payload
  fs.writeFileSync(getPayloadFilename(provider), payload);

  // Refresh payload index and write it
  const jsons = fs.readdirSync(payloadsFolder);
  const gitkeepIndex = jsons.indexOf('.gitkeep');
  if(gitkeepIndex !== -1) {
    delete jsons.splice(gitkeepIndex, 1);
  }
  fs.writeFileSync(jsonFolder + '/payloads.json', JSON.stringify(jsons));

}

module.exports = dumpJsonPayload;