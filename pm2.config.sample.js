module.exports = {
  apps : [
    {
      name      : "git-webhooks-development",
      script    : "server.js",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
}
