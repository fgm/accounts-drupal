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
    "logging",
    "underscore",
    "http",
    "webapp"
  ];

  api.use(coreDependencies);

  //api.use('arunoda:streams@0.1.17');
  api.use('fgm:streams');

  var sharedPre = [
    "DrupalBase",
    "DrupalSSO"
  ];

  var clientOnly = [
    "DrupalClient",
    "clientBoot",
    "clientStartup"
  ];

  var serverOnly = [
    "DrupalConfiguration",
    "DrupalServer",
    "serverBoot",
    "serverStartup"
  ];

  var sharedPost = [
    "Drupal",
    "sharedBoot",
    "sharedStartup"
  ];

  // Package files.
  api.addFiles(files("shared", sharedPre), ["client", "server"]);
  api.addFiles(files("client", clientOnly), "client");
  api.addFiles(files("server", serverOnly), "server");
  api.addFiles(files("shared", sharedPost), ["client", "server"]);

  // Public symbols.
  // - An instance of Drupal.
  api.export(["drupal", "Drupal"]);
});


Package.onTest(function (api) {
  api.use("ecmascript");
  api.use("tinytest");
  api.use("accounts-base");
  api.use("accounts-drupal");
  api.use("mongo");
  api.use("service-configuration");
  api.use("underscore");

  api.addFiles("server/DrupalConfiguration.js", "server");
  api.addFiles("server/serverTests.js", "server");
});

