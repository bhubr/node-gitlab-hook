const GitHubStrategy = require('../lib/GitHubStrategy');
const chai           = require('chai');
const assert         = chai.assert;
const tools          = require('./tools');

describe('GitHubStrategy tests', () => {

  it('map event name', done => {
    const headers = {
      'x-github-event': 'push'
    };
    const strategy = new GitHubStrategy(headers);
    const { event, funcName } = strategy.mapAction();
    assert.equal(event, 'repo:push', "Mapped event name should be 'repo:push'");
    assert.equal(funcName, 'extractRepoPush', "Extractor function should be 'extractRepoPush'");
    done();
  });

  it('extract "push to repo" event', done => {
     const headers = {
      'x-github-event': 'push'
    };
    const strategy = new GitHubStrategy(headers);
    const payload = tools.getSamplePayload('github', 'repo-push');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://github.com/bhubr/test-webhook';
    assert.equal(eventData.event, 'repo:push', "Event should be 'repo:push'");
    assert.equal(eventData.data.name, 'test-webhook', "Repo name should be 'test-webhook'");
    assert.equal(eventData.data.fullName, 'bhubr/test-webhook', "Repo name should be 'bhubr/test-webhook'");
    assert.equal(eventData.data.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

  it('extract "issue edited" event', done => {
    const headers = {
      'x-github-event': 'issues'
    };
    const strategy = new GitHubStrategy(headers);
    const payload = tools.getSamplePayload('github', 'issue-edited');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    console.log(eventData);
    const repoUrl = 'https://github.com/bhubr/test-webhook';
    const { event, data } = eventData;
    const { issue, repository } = data;
    assert.equal(event, 'issue:edited', "Event should be 'issue:edited'");
    assert.equal(issue.title, 'sample issue edited', "Issue title should be 'sample issue edited'");
    assert.equal(issue.body, 'lorem ipsum dolor sucks', "Issue body should be ''lorem ipsum dolor sucks'");
    assert.equal(issue.number, 1, "Issue number should be 1");
    assert.equal(issue.state, 'open', "Issue state should be 'open'");
    assert.equal(issue.htmlUrl, 'https://github.com/bhubr/test-webhook/issues/1', "Issue url should be 'https://github.com/bhubr/test-webhook/issues/1'");
    assert.equal(repository.name, 'test-webhook', "Repo name should be 'test-webhook'");
    assert.equal(repository.fullName, 'bhubr/test-webhook', "Repo name should be 'bhubr/test-webhook'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });
});