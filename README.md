# Accounts-drupal

This is an accounts package for Meteor 1.2, using Drupal sessions transparently:

- The Meteor app is configured to use a specific Drupal server for sessions
- Any user with a session on the Drupal server is automatically logged in on Meteor, without any UI-level intervention
- Switching from anonymous to authenticated (and vice-versa) on Drupal automatically refreshes the status on connected Meteor applications
- Changes in the Drupal user account fields and roles reflects in real-time on connected Meteor applications.
- No dependency on [Drupal DDP] or any intervening `ddp.js` Node server.

## Requirements

- Meteor 1.2.*
- Drupal 8.0.*
- The Drupal [meteor module] from FGM's Github, not to be confused with the existing [meteor sandbox] from drupal.org.
- The cookie domain for the Meteor application must be the same or a subdomain of the Drupal site. This is a consequence of [cookie scope]. Using the same domain on different IP ports works.

[cookie scope]: https://en.wikipedia.org/wiki/HTTP_cookie#Domain_and_Path
[meteor module]: https://github.com/FGM/meteor
[meteor sandbox]: https://www.drupal.org/sandbox/rgarand/2020935
[Drupal DDP]: https://www.drupal.org/sandbox/bfodeke/2354859

# Running a demo
# Configuring the package
## Drupal configuration
## Meteor configuration
# Logging in and out
# Running tests
