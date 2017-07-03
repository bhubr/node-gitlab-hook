const BitBucketStrategy = require('../lib/BitBucketStrategy');
const chai              = require('chai');
const assert            = chai.assert;
const tools             = require('./tools');

const bitbucketIP = '104.192.143.193';

describe('BitBucketStrategy tests', () => {

  it('extract "push to repo" event', done => {
    const headers = {
      'x-real-ip': bitbucketIP,
      'x-event-key': 'repo:push'
    };
    const strategy = new BitBucketStrategy(headers);
    const payload = tools.getSamplePayload('bitbucket', 'repo-push');
    strategy.setData(payload);
    const { event, data } = strategy.getEventData();
    const { repository } = data;
    const repoUrl = 'https://bitbucket.org/bhubr/test-webhook';
    assert.equal(event, 'repo:push', "Event should be 'repo:push'");
    assert.equal(repository.name, 'test-webhook', "Repo name should be 'test-webhook'");
    assert.equal(repository.fullName, 'bhubr/test-webhook', "Repo name should be 'bhubr/test-webhook'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

  it('extract "issue edited" event', done => {
    const headers = {
      'x-event-key': 'issue:updated'
    };
    const strategy = new BitBucketStrategy(headers);
    const payload = tools.getSamplePayload('bitbucket', 'issue-edited');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://bitbucket.org/bhubr/test-webhook';
    const { event, data } = eventData;
    const { issue, repository } = data;
    const issueHtmlUrl = 'https://bitbucket.org/bhubr/test-webhook/issues/1/sample-issue-edited';
    assert.equal(event, 'issue:updated', "Event should be 'issue:updated'");
    assert.equal(issue.title, 'sample issue edited', "Issue title should be 'sample issue edited'");
    assert.equal(issue.body, 'lorem ipsum dolor sucks', "Issue body should be ''lorem ipsum dolor sucks'");
    assert.equal(issue.number, 1, "Issue number should be 1");
    assert.equal(issue.state, 'open', "Issue state should be 'open'");
    assert.equal(issue.htmlUrl, issueHtmlUrl, "Issue url should be '" + issueHtmlUrl + "'");
    assert.equal(repository.name, 'test-webhook', "Repo name should be 'test-webhook'");
    assert.equal(repository.fullName, 'bhubr/test-webhook', "Repo name should be 'bhubr/test-webhook'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });
});