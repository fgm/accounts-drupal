DrupalServer = class DrupalServer extends DrupalShared {
  constructor() {
    super();
  }

  login() {
    Meteor._debug('server login', arguments);
  }
};

Meteor._debug("D Server");
