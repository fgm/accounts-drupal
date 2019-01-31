# Accounts-Drupal package operation

## Events and hooks

The module implements the choices listed in the following table of user-related
events notified by the [Meteor module] for Drupal 8 and similar servers.

[Meteor module]: https://github.com/FGM/meteor

* On logout, clients previously logged as X
  * subscribe to message `anonymous`
  * unsubscribe from message `userId` and `authenticated`
  * all sessions logged in as X are logged out, even if using another underlying
    Drupal session
* On login as user X, client
  * unsubscribe from `anonymous`
  * subscribe to `userId` and `authenticated`

Operation "deferred login" performs a login after a pseudo-random timeout in a
configurable range, to avoid storming the server with login attempts.

During logged-in operation, background whoami checks are run for each user at a
pseudo-random interval (constant +/- pseudo-random variant). If the whoami checks
returns a change from the current account, a login is attempted, otherwise nothing
happens. This enables the package no longer to handle broacasted system-level 
events (`[entity_]field_*`).

Event \ User state  | Server                    | Anon           | X              | Y              |
--------------------|:-------------------------:|:--------------:|:--------------:|:--------------:|
user_delete(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_login(X)       | emit('anonymous')         | deferred login | ignored        | ignored        |
user_logout(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_update(X)      | update(X), emit('userId', userId) | ignored | login         | ignored        |
field_delete        | ignored                   | not notified   | not notified   | not notified   | 
field_insert        | ignored                   | not notified   | not notified   | not notified   |
field_update        | ignored                   | not notified   | not notified   | not notified   |
entity_field_update | ignored                   | not notified   | not notified   | not notified   |
