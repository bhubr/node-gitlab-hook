const GitHubStrategy = require('../lib/GitHubStrategy');
const chai           = require('chai');
const assert         = chai.assert;
const tools          = require('./tools');

const headers = {
  'x-github-event': 'push'
};

describe('GitHubStrategy tests', () => {

  it('map event name', done => {
    const strategy = new GitHubStrategy(headers);
    const { event, funcName } = strategy.mapAction();
    assert.equal(event, 'repo:push', "Mapped event name should be 'repo:push'");
    assert.equal(funcName, 'extractRepoPush', "Extractor function should be 'extractRepoPush'");
    done();
  });

  it('extract "push to repo" event', done => {
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

});