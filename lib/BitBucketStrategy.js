const getExtractEventFunc = require('./getExtractEventFunc');

/**
 * Constructor
 */
function BitBucketStrategy(headers) {
  this.headers = headers;
  this.url = 'https://bitbucket.org/';
  // this.extractEvent();
  this.event = this.headers['x-event-key'];
}

// BitBucketStrategy.prototype.extractEvent = function() {
//   const eventKeyHeader = this.headers['x-event-key'];
//   const bits = eventKeyHeader.split(':');
//   this.eventType = bits[0];
//   this.action = bits[1];
// }

/**
 * Perform security check (none for BitBucket)
 */
BitBucketStrategy.prototype.securityCheck = function(config) {
  return { success: true };
};

/**
 * Populate with parsed body
 */
BitBucketStrategy.prototype.setData = function(data) {
  this.data = data;
}

BitBucketStrategy.prototype.mapAction = function() {
  const map = {
    'repo:push': {
      event: 'repo:push',
      funcName: 'extractRepoPush'
    },
    'issue:updated': {
      event: 'issue:edited',
      funcName: 'extractIssueModified'
    }
  }
  if(map[this.event] === undefined) {
    throw new Error('unhandled event: ' + this.event);
  }
  return map[this.event];
}


BitBucketStrategy.prototype.getEventData = function() {
  const { event, funcName } = this.mapAction();
  const data = this[funcName]();
  return {
    event,
    data
  };
}

BitBucketStrategy.prototype.getRepoData = function(repository) {
  return {
    name: repository.name,
    fullName: repository.full_name,
    url: repository.links.html.href
  }
}

BitBucketStrategy.prototype.mapState = function(origState) {
  const map = {
    'new': 'open',
    open: 'open',
    resolved: 'closed',
    closed: 'closed'
  }
  return map[origState];
}

BitBucketStrategy.prototype.getIssueData = function(issue) {
  const { title, state, content, links } = issue;
  return {
    number: issue.id,
    title,
    body: content.raw,
    state: this.mapState(state),
    htmlUrl: links.html.href
  }
}


BitBucketStrategy.prototype.extractRepoPush = function() {
  const { repository } = this.data;
  // console.log(repository);
  return this.getRepoData(repository);
}

BitBucketStrategy.prototype.extractIssueModified = function() {
  const { repository, issue } = this.data;
  const repoData = this.getRepoData(repository);
  const issueData = this.getIssueData(issue);
  return {
    repository: repoData,
    issue: issueData
  };
}
module.exports = BitBucketStrategy;