# Accounts-Drupal package operation

## Events and hooks

The module implements the choices listed in the following table of user-related
events notified by the [Meteor module] for Drupal 8.

[Meteor module]: https://github.com/FGM/meteor

* On logout, clients previously logged as X
  * subscribe to message `anon`
  * unsubscribe from message `user-${X}` and `users`
* On login as user X, client
  * unsubscribe from `anon`
  * subscribe to `user-${X}` and `users`

Operation "deferred login" performs a login after a pseudo-random timeout in a
configurable range, to avoid storming the server with login attempts.

Event \ User state  | Server                    | Anon           | X              | Y              |
--------------------|:-------------------------:|:--------------:|:--------------:|:--------------:|
user_delete(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_login(X)       | emit('anon', 'login')     | deferred login | not notified   | not notified   |
user_logout(X)      | delete(X)                 | not notified   | → logged out   | not notified   |
user_update(X)      | emit('user-${X}', 'login' | not notified   | login          | not notified   |
field_delete        | emit('users', 'login'     | not notified   | deferred login | deferred login |
field_insert        | emit('users', 'login'     | not notified   | deferred login | deferred login |
field_update        | emit('users', 'login'     | not notified   | deferred login | deferred login |
entity_field_update | emit('users', 'login'     | not notified   | deferred login | deferred login |

During logged-in operation, background whoami checks are run for each user at a
pseudo-random interval (constant +/- pseudo-random variant). If the whoami checks
returns a change from the current account, a login is attempted, otherwise nothing
happens.
