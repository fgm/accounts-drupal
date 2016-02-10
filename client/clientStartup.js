/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(() => {
  Log.info("Client startup");
  if (document.cookie) {
    Log.info("cookies exist, trying to login");
    console.log(drupal);
    drupal.client.login(document.cookie);
  }
  else {
    Log.warn("No cookie: necessarily anonymous.");
  }
});
