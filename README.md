# Readme

## Links
* **App Link** : https://rocky-caverns-13536.herokuapp.com/
* **Workspace Link** : https://app.slack.com/client/TNLTY6N2W/CP1H6G6VD

## Paths
* `get('/', (req, res)`:
  * Display landing page

* `.get("/get_users", async (req,res)`:
  * Calls slack's `user.list` api to get the list of current users in the workspace.
  
* `.get("/list_channels", async (req,res)`:
  * Dsiplays a list of channel memberships for each user in the Slack workspace.

* `.post('/users', async (req, res)`:
  * Events Coming from Slack's EvenAPI are received here. The slack application is subscribed to `user-change`, `team_join`, `member_joined_channel` and `member_left_channel` events. The SQL db tables are updated accordingly. 

## Testing
Tun `npm test` from the directory root to run `test.js`. This verifies that calls to slack apis work and are authorized.
