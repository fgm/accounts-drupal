/**
 * @file
 *   Client-side startup code.
 */

Meteor.startup(() => {
  Log.debug("Client startup");

  if (document.cookie) {
    Log.info("Cookies exist, attempting Drupal login");
    // Attempt login if a cookie exists, logout otherwise.
    // XXX Consider taking a callback from the application here.
    client.login(document.cookie);
  }
});
