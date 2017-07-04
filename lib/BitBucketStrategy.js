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
    'issue:created': {
      event: 'issue:created',
      funcName: 'extractIssue'
    },
    'issue:updated': {
      event: 'issue:updated',
      funcName: 'extractIssue'
    },
    'pullrequest:created': {
      event: 'pullrequest:created',
      funcName: 'extractPullRequest'
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

BitBucketStrategy.prototype.mapIssueState = function(origState) {
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
    body: content.raw.replace(/\r/g, ''),
    state: this.mapIssueState(state),
    htmlUrl: links.html.href
  }
}

BitBucketStrategy.prototype.mapPullState = function(origState) {
  const map = {
    OPEN: 'open',
    MERGED: 'merged',
    DECLINED: 'declined'
  }
  return map[origState];
}
BitBucketStrategy.prototype.getPullRequestData = function(pullRequest) {
  const { title, description, links, id, state, source, destination } = pullRequest;
  return {
    number: id,
    title,
    body: description.replace(/\r/g, ''),
    state: this.mapPullState(state),
    htmlUrl: links.html.href,
    sourceBranch: source.branch.name,
    sourceRepo: this.getRepoData(source.repository),
    targetBranch: destination.branch.name,
    targetRepo: this.getRepoData(destination.repository)
  };
}


BitBucketStrategy.prototype.extractRepoPush = function() {
  const { repository } = this.data;
  // console.log(repository);
  return {
    repository: this.getRepoData(repository)
  };
}

BitBucketStrategy.prototype.extractIssue = function() {
  const { repository, issue } = this.data;
  const repoData = this.getRepoData(repository);
  const issueData = this.getIssueData(issue);
  return {
    repository: repoData,
    issue: issueData
  };
}

BitBucketStrategy.prototype.extractPullRequest = function() {
  const { repository, pullrequest } = this.data;
  const repoData = this.getRepoData(repository);
  const pullRequestData = this.getPullRequestData(pullrequest);
  return {
    repository: repoData,
    pullRequest: pullRequestData
  };
}

module.exports = BitBucketStrategy;