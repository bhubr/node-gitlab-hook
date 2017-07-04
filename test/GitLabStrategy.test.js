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
    const { event, data } = strategy.getEventData();
    const { repository } = data;
    const repoUrl = 'https://gitlab.com/goodkarma/foobar';
    assert.equal(event, 'repo:push', "Event should be 'repo:push'");
    assert.equal(repository.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(repository.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

  it('extract "issue created" event', done => {
    const headers = {
      'x-gitlab-event': 'Issue Hook'
    };
    const strategy = new GitLabStrategy(headers);
    const payload = tools.getSamplePayload('gitlab', 'issue-created');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://gitlab.com/goodkarma/foobar';
    const issueUrl = 'https://gitlab.com/goodkarma/foobar/issues/11';
    const { event, data } = eventData;
    const { issue, repository } = data;
    assert.equal(event, 'issue:created', "Event should be 'issue:created'");
    assert.equal(issue.title, 'Test Issue', "Issue title should be 'Test Issue'");
    assert.equal(issue.body, '## Try some **Markdown**.\nYay :)', "Issue body should be '## Try some **Markdown**.\nYay :)'");
    assert.equal(issue.number, 11, "Issue number should be 11");
    assert.equal(issue.state, 'open', "Issue state should be 'open'");
    assert.equal(issue.htmlUrl, issueUrl, "Issue url should be '" + issueUrl + "'");
    assert.equal(repository.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(repository.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

  it('extract "issue edited" event', done => {
    const headers = {
      'x-gitlab-event': 'Issue Hook'
    };
    const strategy = new GitLabStrategy(headers);
    const payload = tools.getSamplePayload('gitlab', 'issue-updated');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://gitlab.com/goodkarma/foobar';
    const issueUrl = 'https://gitlab.com/goodkarma/foobar/issues/27';
    const { event, data } = eventData;
    const { issue, repository } = data;
    assert.equal(event, 'issue:updated', "Event should be 'issue:updated'");
    assert.equal(issue.title, 'GitLab hook for auto-update', "Issue title should be 'GitLab hook for auto-update'");
    assert.equal(issue.body, 'handle:\n- push events\n- issue events: create, update', "Issue body should be 'handle:\n- push events\n- issue events: create, update'");
    assert.equal(issue.number, 27, "Issue number should be 27");
    assert.equal(issue.state, 'open', "Issue state should be 'open'");
    assert.equal(issue.htmlUrl, issueUrl, "Issue url should be '" + issueUrl + "'");
    assert.equal(repository.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(repository.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

  it('extract "pull request created" event', done => {
    const headers = {
      'x-gitlab-event': 'Merge Request Hook'
    };
    const strategy = new GitLabStrategy(headers);
    const payload = tools.getSamplePayload('gitlab', 'pullrequest-created');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://gitlab.com/goodkarma/foobar';
    const pullUrl = 'https://gitlab.com/goodkarma/foobar/merge_requests/6';
    const pullBody = 'Hotfix for #32\r\nYay :)';
    const { event, data } = eventData;
    const { pullRequest, repository } = data;
    assert.equal(event, 'pullrequest:created', "Event should be 'pullrequest:created'");
    assert.equal(pullRequest.title, 'Source branch', "Pull request title should be 'Source branch'");
    assert.equal(pullRequest.body, pullBody, "Pull request body should be '" + pullBody + "'");
    assert.equal(pullRequest.number, 6, "Pull request number should be 6");
    assert.equal(pullRequest.state, 'open', "Pull request state should be 'open'");
    assert.equal(pullRequest.htmlUrl, pullUrl, "Pull request url should be '" + pullUrl + "'");
    assert.equal(pullRequest.sourceBranch, 'source-branch', "Pull request's source branch should be 'source-branch'");
    assert.equal(pullRequest.targetBranch, 'master', "Pull request's target branch should be 'master'");
    assert.equal(pullRequest.sourceRepo.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(pullRequest.sourceRepo.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(pullRequest.sourceRepo.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    assert.equal(pullRequest.targetRepo.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(pullRequest.targetRepo.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(pullRequest.targetRepo.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    assert.equal(repository.name, 'foobar', "Repo name should be 'foobar'");
    assert.equal(repository.fullName, 'goodkarma/foobar', "Repo name should be 'goodkarma/foobar'");
    assert.equal(repository.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });
});