var crypto = require('crypto');

/**
 * Constructor
 */
function GitHubStrategy(headers) {
  this.headers = headers;
  this.eventType = headers['x-github-event'];
}

/**
 * Perform security check (check against x-hub-signature header)
 */
GitHubStrategy.prototype.securityCheck = function(config, body) {
  // console.log('## headers for GitHub', this.headers);
  var providedSignature = this.headers['x-hub-signature'];
  if(typeof body !== 'string') {
    return { success: false, reason: 'body parameter should be a string' }
  };
  if(config.secretToken === undefined && providedSignature === undefined) {
    return { success: true };
  }
  if(config.secretToken === undefined && providedSignature !== undefined) {
    return {
      success: false,
      reason: 'Secret token set in GitHub but not expected'
    }
  }
  else if(config.secretToken !== undefined && providedSignature === undefined) {
    return {
      success: false,
      reason: 'Secret token expected but not set in GitHub'
    }
  }
  else {
    // console.log('## github body', body);
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

/**
 * Populate with parsed body
 */
GitHubStrategy.prototype.setData = function(data) {
  this.data = data;
}

GitHubStrategy.prototype.getEventType = function() {
  return this.eventType;
  // var eventKeyHeader = this.headers['x-github-event'];
  // var bits = eventKeyHeader.split(':');
  // return {
  //   object: bits[0],
  //   action: bits[1]
  // };

};

module.exports = GitHubStrategy;