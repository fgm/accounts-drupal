/**
 * @file
 *   Contains accounts-drupal client code.
 *
 * - Meteor.loginWithDrupal([options, ]callback)
 */

Log.debug('Client boot');

const template = (typeof Template === 'undefined') ? null : Template;

// Client is package-global but not exported.
client = new DrupalClient(Accounts, Meteor, Log, Match, stream, template, Random);

/**
 * Need to wrap client.login in a closure to avoid overwriting this in login().
 *
 * @param {function} callback
 *   Optional. A callback to be called at the end of login, with (err, res).
 *
 * @return {void}
 */
Meteor.loginWithDrupal = function (callback) {
  client.login(document.cookie, callback);
};
