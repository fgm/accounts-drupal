import { DrupalBase } from "../shared/DrupalBase";
import { Drupal } from "../shared/Drupal";
import { clientBoot }from "./clientBoot";

const onStartupFactory = (
  template = Template,
  accounts = Accounts,
  meteor = Meteor,
  logger = Log,
  match = Match,
  random = Random,
) => () => {
  const stream = new Meteor.Streamer(DrupalBase.STREAM_NAME);
  const client = clientBoot(template, accounts, meteor, logger, match, stream, random);

  /**
   * Need to wrap client.login in a closure to avoid overwriting this in login().
   *
   * @param {function} callback
   *   Optional. A callback to be called at the end of login, with (err, res).
   *
   * @return {void}
   */
  meteor.loginWithDrupal = onLoginFactory(client);
  return client;
};

const onLoginFactory = (
  accounts,
  logger,
  match,
  meteor,
  random,
  template,
) => () => {
  logger.debug('Client startup');
  const client = onStartupFactory(template, accounts, meteor, logger, match, random);
  const drupal = new Drupal(meteor, logger, client);
  if (document.cookie) {
    logger.debug("Cookies exist, attempting Drupal login");
    // Attempt login if a cookie exists, logout otherwise.
    // XXX Consider taking a callback from the application here.
    client.login(document.cookie);
  }
  return drupal;
};

export {
  Drupal,
  onStartupFactory,
}
