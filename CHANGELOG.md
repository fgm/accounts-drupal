# Changelog

## 0.4.x: developer and admin experience
- 0.4.2 
  - Made logs both less verbose and more useful. 
  - Cookie check implementation simplified, no longer using exceptions
  - new CHANGELOG.md file
  - Removed unneeded eslint-plugin-react dependency
- 0.4.1 Fixed error invoking login callback on failed login.
- 0.4.0 Control of package initialization 
  - Support for Meteor 1.8.x. Earlier versions dropped.
  - Initialization triggered in Meteor.startup(), not a package side-effect
  - Use dependency injection a lot more instad of pulling Meteor globals
  - Major code restructuring 

## 0.3.x: production improvements

- 0.3.6 Support Meteor 1.2-1.7, and Symfony 3.x/4.x backends in addition to Drupal 8 
- 0.3.5 Templating package (Blaze) made optional.
- 0.3.4 Login peaks avoidance, with pseudo-randomized background login refresh
- 0.3.3 Support for Meteor 1.2-1.6.
- 0.3.2 New "updaters" setting to limit authorized backends. ESLint review.
- 0.3.1 Reduced logging verbosity, Meteor 1.2-1.4, Drupal 8.0-8.3 support
- 0.3.0 Robustness 
  - Reduced broadcast scope over streamer
  - Removed public autologin setting
  - Handling of all Drupal 8 user/field events
  - Design documentation in OPERATION.md
  - Use of single Connect route for push notifications from Drupal server
  
## 0.2.x: first production

- 0.2.6 Switch from arunoda:streams/fgm:streams to rocketchat:streamer
- 0.2.5 Support for Meteor 1.2-1.4
- 0.2.4 Support for multi-server (redundant) topologies
- 0.2.3 Support for BasicAuth authentication to the Drupal backend
- 0.2.2 Documentation improvements
- 0.2.1 First working release for Meteor 1.2-1.3, using fgm:streams

## 0.0.x Early efforts

- 0.1.x never existed
- 0.0.1 unpublished version, for Meteor 1.2, using arunoda:streams
