/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(() => {
  Log.info("Client startup");
  if (document.cookie) {
    Log.info("cookies exist, trying to login");
    client.login(document.cookie);
  }
  else {
    Log.warn("No cookie: necessarily anonymous.");
  }
});
