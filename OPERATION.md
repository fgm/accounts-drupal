# Accounts-Drupal package operation

## Events and hooks

The module implements the choices listed in the following table of user-related
events notified by the [Meteor module] for Drupal 8.

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

Event \ User state  | Server                    | Anon           | X              | Y              |
--------------------|:-------------------------:|:--------------:|:--------------:|:--------------:|
user_delete(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_login(X)       | emit('anonymous')         | deferred login | not notified   | not notified   |
user_logout(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_update(X)      | emit('userId', userId)    | not notified   | login          | not notified   |
field_delete        | emit('authenticated')     | not notified   | deferred login | deferred login |
field_insert        | emit('authenticated')     | not notified   | deferred login | deferred login |
field_update        | emit('authenticated')     | not notified   | deferred login | deferred login |
entity_field_update | emit('authenticated')     | not notified   | deferred login | deferred login |

Planned change:

- During logged-in operation, background whoami checks are run for each user at a
pseudo-random interval (constant +/- pseudo-random variant). If the whoami checks
returns a change from the current account, a login is attempted, otherwise nothing
happens.
- This enables the package no longer to handle broacasted system-level events 
  (`[entity_]field_*`) and only handle the non-broadcast events, to reduce load.
