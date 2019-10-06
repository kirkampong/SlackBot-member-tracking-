const { spawn } = require('child_process');
const test = require('tape');
const exported = require('./index');

// Run with --> 'npm test'
const env = Object.assign({}, process.env, {PORT: 5000});
const child = spawn('node', ['index.js'], {env});

// Use Slack Auth API verify requests to Slack are authorized and work.
test('test_call_to_slack_api', (t) => {
  console.log("Sending test message to Slack...");
  t.plan(1);
  const method = "POST";
  const slackURL = "https://slack.com/api/auth.test";
  const contentType = "application/json";

  exported.make_slack_request(slackURL, method, contentType, (result) => {
    let resultObj = JSON.parse(result);
    t.true(resultObj.ok); //Authentication succeeds
    console.log("AuthResults: " + resultObj.ok);
  });

  delay(function(){
    child.kill();
    t.end();
  }, 5000);
});

test.onFinish(() => process.exit(0));

const delay = (function () {
  let timer = 0;
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();
