/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(() => {
  Log.debug("Client startup");
  if (client.isAutologinEnabled()) {
    if (document.cookie) {
      Log.info("Cookies exist, attempting Drupal login");
    }
    // Attempt login if a cookie exists, logout otherwise.
    client.login(document.cookie);
  }
  else {
    Log.info("Auto-login not enabled in settings.");
  }
});
