/**
 * Constructor
 */
function GitLabStrategy(headers) {
  this.headers = headers;
  this.eventType = headers['x-gitlab-event'];
}

/**
 * Perform security check (check against x-gitlab-token header)
 */
GitLabStrategy.prototype.securityCheck = function(config) {
  var tokenHeader = this.headers['x-gitlab-token'];
  console.log('GitLabStrategy.securityCheck', this.headers, config, tokenHeader);
  if(config.secretToken === undefined && tokenHeader === undefined) {
    return { success: true };
  }
  if(config.secretToken === undefined && tokenHeader !== undefined) {
    return {
      success: false,
      reason: 'Secret token set in GitLab but not expected'
    }
  }
  else if(config.secretToken !== undefined && tokenHeader === undefined) {
    return {
      success: false,
      reason: 'Secret token expected but not set in GitLab'
    }
  }
  else {
    var payload = {
      success: config.secretToken === tokenHeader
    };
    if(! payload.success) {
      payload.reason = 'Secret token does not match expected value (received: ' +
        tokenHeader + ', expected: ' + config.secretToken + ')';
    }
    return payload;
  }
};

/**
 * Populate with parsed body
 */
GitLabStrategy.prototype.setData = function(data) {
  this.data = data;
}

GitLabStrategy.prototype.getEventType = function() {
  return this.eventType;
  // var eventKeyHeader = this.headers['x-github-event'];
  // var bits = eventKeyHeader.split(':');
  // return {
  //   object: bits[0],
  //   action: bits[1]
  // };

};

module.exports = GitLabStrategy;