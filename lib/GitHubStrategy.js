var crypto = require('crypto');

function GitHubStrategy() {
	
}

GitHubStrategy.prototype.securityCheck = function(headers, config, body) {
  // console.log('## headers for GitHub', headers);
  if(typeof body !== 'string') {
    return { success: false, reason: 'body parameter should be a string' }
  };
  if(config.secretToken === undefined && headers['x-hub-signature'] === undefined) {
    return { success: true };
  }
  if(config.secretToken === undefined && headers['x-hub-signature'] !== undefined) {
    return {
      success: false,
      reason: 'Secret token set in GitHub but not expected'
    }
  }
  else if(config.secretToken !== undefined && headers['x-hub-signature'] === undefined) {
    return {
      success: false,
      reason: 'Secret token expected but not set in GitHub'
    }
  }
  else {
    // console.log('## github body', body);
    var providedSignature = headers['x-hub-signature'];
    var key = config.secretToken;
    var expectedSignature = 'sha1=' + crypto.createHmac('sha1', key).update(body).digest('hex');
    console.log('## github signatures (provided/expected)', providedSignature, expectedSignature);
    var payload = {
      success: providedSignature === expectedSignature
    };
    if(! payload.success) {
      payload.reason = "Signatures don't match (received: " +
        providedSignature + ', expected: ' + expectedSignature + ')';
    }
    return payload;
  }
};

module.exports = GitHubStrategy;