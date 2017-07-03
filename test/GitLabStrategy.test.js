const GitLabStrategy = require('../lib/GitLabStrategy');
const chai           = require('chai');
const assert         = chai.assert;
const tools          = require('./tools');

const headers = {
  'x-gitlab-event': 'Push Hook'
};

describe('GitLabStrategy tests', () => {

  it('map event name', done => {
    const strategy = new GitLabStrategy(headers);
    const mappedPush = strategy.mapEventName();
    assert.equal(mappedPush, 'repo:push', "Mapped event name should be 'repo:push'");
    done();
  });

  it('extract "push to repo" event', done => {
    const strategy = new GitLabStrategy(headers);
    const payload = tools.getSamplePayload('gitlab', 'repo-push');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://gitlab.com/goodkarma/foobar';
    assert.equal(eventData.event, 'repo:push', "Event should be 'repo:push'");
    assert.equal(eventData.data.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(eventData.data.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(eventData.data.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

});