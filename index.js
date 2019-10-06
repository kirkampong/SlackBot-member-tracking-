const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
const env = require('process-env');

const pool = new Pool({
  connectionString: env.get("DATABASE_URL"),
  ssl: true
});

function make_slack_request(slackURL, method, contentType, callback) {
  const token = env.get("SLACK_OAUTH_TOKEN");
  const bToken = 'Bearer ' + token;
  const options = {
    method: method,
    token: token,
    headers: {
      'Content-Type': contentType,
      'Authorization': bToken
    },
  };
  request(slackURL, options, (error, response, body) => {
    if(error){
      console.log("An error occurred: " + error);
    } else {
      callback(body, response);
    }
  });
}

express()
    .use(express.static(path.join(__dirname, 'public')))
    .use(bodyParser.urlencoded({ extended: false }))
    .use(bodyParser.json())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))

    .get("/get_users", async (req,res) => {
      console.log("Executing /get_users. Fetching Slack users and persisting to Database...");
      const method = "GET";
      const slackURL = "https://slack.com/api/users.list";
      const contentType = "application/x-www-form-urlencoded";

      make_slack_request(slackURL, method, contentType, async (result) => {
        let resultObj = {};
        if(result) {
          try {
            resultObj = JSON.parse(result);
          } catch(err) {
            console.error(err);
          }
        }
        let members = resultObj.members;

        try{
          const client = await pool.connect();
          members
              .filter((member) => member.deleted === false)
              .forEach(async (member) => {
                let userName = member.real_name;
                let userId = member.id;
                let query = `INSERT INTO Users(Name, Id) SELECT ('${userName}'),('${userId}') 
                         WHERE NOT EXISTS (SELECT id FROM Users WHERE id='${userId}')`;
                await client.query(query);
              });

          const result = await client.query('SELECT * FROM Users');
          const users = {'users': (result) ? result.rows : null};
          res.render('pages/users', users);
          client.release();
        } catch (err) {
          console.error(err);
          res.end("Error: " + err);
        }
      });
    })

    .post('/users', async (req, res) => {
      console.log("event_received");
      const eventType = req.body.event.type;
      const user = req.body.event.user;

      const client = await pool.connect();
      try {
        let userName = user.real_name;
        let userId = user.id;
        let deleted = user.deleted;
        switch (eventType) {
          case "team_join":
            let joinQuery = `INSERT INTO Users(Name, Id) SELECT ('${userName}'),('${userId}') 
                         WHERE NOT EXISTS (SELECT Id FROM Users WHERE Id='${userId}'`;
            await client.query(joinQuery);
            break;
          case "user_change":
            if(deleted) {
              let updateQuery = `DELETE FROM Users WHERE Id='${userId}'`;
              await client.query(updateQuery);
            } else {
              let deleteQuery = `UPDATE Users SET Name = '${userName}' WHERE Id='${userId}'`;
              await client.query(deleteQuery);
            }
            break;
          default:
            console.error("Unrecognized event type received");
        }
        client.release();
      } catch (err) {
        client.release();
        console.error(err);
        res.end("Error: " + err);
      }
      res.end("event_received");
    })

    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

module.exports = {make_slack_request};
