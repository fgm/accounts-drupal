# Accounts-drupal
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ffgm%2Faccounts-drupal.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Ffgm%2Faccounts-drupal?ref=badge_shield)


This is an accounts package for Meteor 1.8, using Drupal 8 or pure Symfony
backend sessions transparently:

- The Meteor app is configured to use a specific backend server for sessions
- Any user with a session on the backend server is automatically logged in on
  Meteor, without any UI-level intervention
- Switching from anonymous to authenticated (and vice-versa) on the backend
  server automatically refreshes the status on connected Meteor applications
- Changes in the backend user account fields and roles reflects in real-time on
  connected Meteor applications.
- No dependency on [Drupal DDP] nor any intervening `ddp.js` NodeJS server.


## Requirements

- Meteor 1.8.x. 
  - Use the latest 0.3.x version of the package to support Meteor 1.2 to 1.7.
- For the backend site: 
  - either Drupal 8.0.x to 8.6.x, with the Drupal [meteor module] from FGM's 
    Github, not to be confused with the existing [meteor sandbox] from 
    drupal.org. Drupal [8.7.x session changes] will be updated in a later
    version
  - or Symfony 3.4.x or 4.x, with equivalent support in a Symfony backend. Such
    existing code is currently only available as proprietary. Follow issue for
    an [Open Source version] of the Symfony backend
- The cookie domain for the Meteor application *must* be the same or a subdomain
  of the backend site. This is a consequence of [cookie scope]. Using the same
  domain on different IP ports works, as long as the backend cookies settings:
  - do not include the port number (included by default in Symfony)
  - do not mark the cookie as `HTTPonly` (marked by default in Symfony)

- If the Template package is present, Blaze helpers will be available, but that
  package is not a requirement.

[8.7.x session changes]:  https://github.com/fgm/accounts-drupal/issues/22
[Open Source version]: https://github.com/fgm/meteor/issues/8
[cookie scope]: https://en.wikipedia.org/wiki/HTTP_cookie#Domain_and_Path
[meteor module]: https://github.com/FGM/meteor
[meteor sandbox]: https://www.drupal.org/sandbox/rgarand/2020935
[Drupal DDP]: https://www.drupal.org/sandbox/bfodeke/2354859


## Adding the package to your application

The package needs to be added to both the client and server parts of your Meteor
application. Assuming you defined a `logger` instance of a Meteor-compatible 
logger component like [filog] for both sides, the setup looks like:

[filog]: https://npmjs.org/filog

```ecmascript 6
// (app)/package.json
// ...
  "meteor": {
    "mainModule": {
      "client": "imports/client/main.js",
      "server": "imports/server/main.js"
    }
  },
// ...
```

```ecmascript 6
// (app)/imports/client/main.js

Meteor.startup(() => {
  // Configure a logger instance, then...
  onStartup(logger, Meteor.settings.public);
));
```

```ecmascript 6
// (app)/imports/server/main.js

Meteor.startup(() => {
  // Configure a logger instance, then...
  onStartup(logger, Meteor.settings);
});
```


## Updaters note after package version 0.2.6

If you disabled update buffering on the client using code like the fragment
below to support Meteor 1.3.3 and later with earlier versions of this package
which relied on `arunoda:streams` or the `fgm:streams` fork, this stopped being
needed after version 0.2.6:

    Meteor.startup(function () {
      Meteor.connection._bufferedWritesInterval = 0;
    });

The package now uses `rocketchat:streamer` instead, so you *should* remove this
line to take advantage of the buffered writes present since Meteor 1.3.3.

<!--
# Running a demo
# Configuring the package
## Drupal configuration
## Meteor configuration
# Logging in and out
-->

# Running tests

The package can be tested once added to an application. Note that the
`test-packages` command needs a `--settings` argument like a normal application
launch. This can be the example settings file from the package.

```bash
cd <some parent dir>
git clone https://github.com/fgm/accounts-drupal.git
cd accounts-drupal
meteor yarn
meteor test-packages --driver-package meteortesting:mocha --settings ./example.settings.json ./  

# This will run the server-side tests and report on them. 
# Open your browser at http://localhost:3000 to observe the client-side test report.
```

Remember not to have anything already running on port 3000, like an actual Meteor
application, to avoid IP binding conflicts.


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ffgm%2Faccounts-drupal.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Ffgm%2Faccounts-drupal?ref=badge_large)