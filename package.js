/**
 * @file
 *   Package description file for accounts-drupal.
 *
 * Note: package.js is NOT passed to Babel on Meteor 1.2/1.2.1, so not ES6.
 */

Package.describe({
  name: "accounts-drupal",
  version: "0.0.1",
  // Brief, one-line summary of the package.
  summary: "A Meteor 1.2 accounts system using Drupal 8 sessions.",
  git: "",
  documentation: "README.md"
});

Package.onUse(function (api) {
  function files(location, names) {
    const base = location + "/";
    const files = names.map(function (v, k, a) {
      return base + v + ".js";
    });
    return files;
  }

  api.versionsFrom("1.2.1");

  // Dependencies.
  var coreDependencies = [
    "ecmascript",
    "check",
    "accounts-base",
    "service-configuration",
    "underscore"
  ];

  api.use(coreDependencies);

  // api.use("fgm:drupal-sso");

  var clientOnly = [
    "DrupalClient",
    "clientBoot",
    "clientStartup"
  ];

  var serverOnly = [
    "DrupalServer",
    "serverBoot",
    "serverStartup"
  ];

  var shared = [
    "DrupalShared",
    "sharedBoot",
    "sharedStartup"
  ];

  // Package files.
  api.addFiles(files("shared", shared), ["client", "server"]);
  api.addFiles(files("client", clientOnly), "client");
  api.addFiles(files("server", serverOnly), "server");

  // Public symbols.
  // - An instance of DrupalShared.
  api.export("drupal");
});
