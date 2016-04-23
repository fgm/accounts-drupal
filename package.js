/**
 * @file
 *   Package description file for accounts-drupal.
 *
 * Note: package.js is NOT passed to Babel on Meteor 1.2/1.3, so not ES6.
 */

// Dependencies.
const coreDependencies = [
  "ecmascript",
  "accounts-base",
  "check",
  "http",
  "logging",
  "service-configuration",
  "templating",
  "tracker",
  "underscore",
  "webapp"
];

Package.describe({
  name: "fgm:accounts-drupal",
  version: "0.2.1",
  // Brief, one-line summary of the package.
  summary: "A Meteor 1.2/1.3 accounts system using Drupal 8 sessions.",
  git: "",
  documentation: "README.md"
});

Package.onUse(function (api) {
  function files(location, names) {
    const base = location + "/";
    return names.map(function (v) {
      return base + v + ".js";
    });
  }

  api.versionsFrom("1.2.1");

  api.use(coreDependencies);

  // api.use('arunoda:streams@0.1.17');
  api.use("fgm:streams@0.1.18");

  const sharedPre = [
    "DrupalBase",
    "sharedBootPre"
  ];

  const clientOnly = [
    "DrupalClient",
    "clientBoot",
    "clientStartup"
  ];

  const serverOnly = [
    "DrupalConfiguration",
    "DrupalServer",
    "serverBoot",
    "serverStartup"
  ];

  const sharedPost = [
    "Drupal",
    "sharedBootPost",
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
  api.use(coreDependencies);
  api.use("tinytest");
  api.use("fgm:accounts-drupal");
  api.use("mongo");

  api.addFiles("server/DrupalConfiguration.js", "server");
  api.addFiles("server/serverTests.js", "server");
});

