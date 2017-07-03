const getExtractEventFunc = require('./getExtractEventFunc');

/**
 * Constructor
 */
function GitLabStrategy(headers) {
  this.headers = headers;
  this.event = headers['x-gitlab-event'];
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

/**
 * Map GitLab event to BitBucket event name
 */
GitLabStrategy.prototype.mapEventName = function() {
  const map = {
    'Push Hook': 'repo:push'
  }
  return map[this.event];
}

GitLabStrategy.prototype.getEventData = function() {
  const event = this.mapEventName();
  const funcName = getExtractEventFunc(event);
  const data = this[funcName]();
  return {
    event,
    data
  };
}

GitLabStrategy.prototype.extractRepoPush = function() {
  const { project, repository } = this.data;
  return {
    name: repository.name,
    fullName: project.path_with_namespace,
    url: project.web_url
  }
}

module.exports = GitLabStrategy;