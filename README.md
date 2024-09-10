# hmpo-form-wizard

Creates routing and request handling for a multi-step form process.

Given a set of form steps and field definitions, the wizard function will create an express router with routing bound to each step of the form and input validation applied as configured.

Additional checks are also applied to ensure a user completes the form in the correct order.

## Usage

Define a set of steps:

```javascript
// steps.js
module.exports = {
  '/step1': {
    next: 'step2'
  },
  '/step2': {
    fields: ['name'],
    next: 'step3'
  },
  '/step3': {
    fields: ['age'],
    next: [
      { field: 'age', op: '<', value: 18, next: 'not-old-enough' },
      'step4'
    ]
  },
  '/step4': {},
  '/not-old-enough': {}
}
```

Define field rules:

```javascript
// fields.js
module.exports = {
  'name': {
    validate: 'required'
  },
  'age': {
    validate: 'required'
  }
}
```

Create a wizard and bind it as middleware to an app:

```javascript
const wizard = require('hmpo-form-wizard');
const steps = require('./steps');
const fields = require('./fields');

app.use(wizard(steps, fields, { name: 'my-wizard' }));
```

## Sessions

The wizard expects some kind of session to have been created in previous middleware layers.

For production use a database backed session store is recommended - such as [connect-redis](https://github.com/tj/connect-redis).

The wizard stores values and state in a model synchronised to the session. This is made available as `req.sessionModel`. This provides `get()`, `set()`, `unset()`, `toJSON()`, and `reset()` methods.

The wizard shares journey step history with other wizards through a journey model on the session. The is exposed as `req.journeyModel`. The history is available as `req.journeyModel.get('history')`.

## Error handling

The app should provide error middleware that redirects to the location specified by the `redirect` property of the error. This is to allow any error to be intercepted before redirection occurs.

```javascript
app.use((error, req, res, next) => {
  if (error.redirect) return res.redirect(error.redirect);
  next(error);
});
```

## Additional step options

The minimum amount of configuration for a wizard step is the `next` property to determine where the user should be taken after completing a step. A number of additional properties can be defined.

Any of these options can also be provided as a third argument to the wizard to customise aspects of the behaviour for all steps.

* `name` - A namespace identifier for the wizard. This is used to store wizard data on the session. This defaults to a unique value for a wizard.
* `journeyName` - A namespace identifier for the entire journey. This is used to store journey-wide data such as step history on the session. Defaults to `default`.
* `entryPoint` - Allows a user to navigate to this step with no journey step history. Defaults to `false`.
* `checkSession` - Check if the session has expired. Defaults to `true`.
* `checkEntryPointSession` = Check if session has expired on entry points. Defaults to `false`
* `checkJourney` - Check this step is allowed based on the journey step history. If this step is not allowed the user is redirected to the last allowed step, or an error is returned if no step is allowed. Defaults to `true`.
* `reset` - Reset the wizard `sessionModel` when this step is accessed. Defaults to `false`.
* `resetJourney` - Reset the journey `journeyModel` when this step is accessed.
* `skip` - A template is not rendered on a GET request. The `post()` lifecycle is called instead. Defaults to `false`.
* `noPost` - Don't allow posting to this step. The post method is set to null and the step is completed if there is a next step
* `forwardQuery` - forward the query params when internally redirecting. Defaults to `false`.
* `editable` - This step is editable. This allows accessing this step with the `editSuffix` and sets the back link and next step to the `editBackStep`. Defaults to `false`.
* `editSuffix` - Suffix to use for editing steps. Defaults to `/edit`.
* `editBackStep` - Location to return to after editing a step. Defaults to `confirm`
* `continueOnEdit` - While editing, if the step marked with this is evaluated to be the next step, continue to editing it instead of returning to `editBackStep`. Defaults to `false`.
* `fields` - specifies which of the fields from the field definition list are applied to this step. Form inputs which are not named on this list will not be processed. Default: `[]`
* `template` - Specifies the template to render for GET requests to this step. Defaults to the route (without trailing slash)
*  `templatePath` - provides the location within `app.get('views')` that templates are stored.
* `backLink` - Specifies the location of the step previous to this one.
* `backLinks` - Specifies valid referrers that can be used as a back link. If this or `backLink` are not specified then an algorithm is applied which checks the previously visited steps which have the current step set as `next`.
* `controller` - The constructor for the controller to be used for this step's request handling. The default is exported as a `Controller` property of this module. If custom behaviour is required for a particular form step then custom extensions can be defined - see [Custom Controllers](#custom-controllers)
* `decisionFields` - Additional fields that we be recorded as being part of this step's routing decision. Default: `[]`
* `revalidate` - Show this page instead of only recalculating the routing if this page is marked invalid. Default: `false`
* `revalidateIf` - Show this page instead of only recalculating the routing if one of these values is changed. Default: `[]`
* `translate` - provide a function for translating validation error codes into usable messages. Previous implementations have used [i18next](https://www.npmjs.com/package/i18next) to do translations.
* `params` - Define express parameters for the route for supporting additional URL parameters.

Remaining field options documentation can be found in the hmpo-template-mixins [README](https://github.com/UKHomeOffice/passports-template-mixins#options-1).

## Field options
See hmpo-template-mixins or hmpo-components for additional field options.

* `journeyKey` - Name of the cross-wizard field storage name
* `default` - Default value for this field
* `multiple` - Allow multiple incomming values for a field. The result is presented as an array
* `formater` - Array of formatter names for this field in addition to the default formatter set, or formatter objects
  * `type` - Formatter name
  * `fn` - Formatter function
  * `arguments` - Array of formatter arguments, eg. `{ type: 'truncate', arguments: [24] }`
* `ignore-defaults` - Disabled the default set of formatters for this field
* `validate` - An array of validator names, or validator objects
  * `type` - Validator name
  * `fn` - Validator function
  * `arguments` - Array of validator arguments, eg. `{ type: 'minlength', arguments: [24] }`
* `items` - Array of select box or radio button options
  * `value` - Item value
* `dependent` - Name of field to make this field conditional upon. This field will not be validated  or stored if this condition is not met. Can also also be an object to specify a specific value instead of the default of `true`:
  * `field` - Field name
  * `value` - Field value
* `invalidates` - an array of field names that will be 'invalidated' when this field value is set or changed. Any fields specified in the `invalidates` array will be removed from the `sessionModel`. Future steps that have used this value to make a branching decision will also be invalidated, making the user go through those steps and decisions again.
* `contentKey` - localisation key to use for this field instead of the field name

## Central journey storage
To facilitate sharing form values between wizards in the same journey a field can be specified to save into the `journeyModel` instead of the `sessionModel` using the `journeyKey` property:

```javascript
// fields.js
module.exports = {
  'localFieldName': {
    journeyKey: 'centralfieldName',
  }
}
```

## Default field values
A default value for a field can be specified with the `default` property. This is used if the value loaded from the session is missing or undefined.

```javascript
// fields.js
module.exports = {
  'localFieldName': {
    default: 'defaultValue'
  }
}
```


## Next steps

The next step for each step can be a relative path, an external URL, or an array of conditional next steps. Each condition next step can contain a next location, a field name, operator and value, or a custom condition function:

```javascript
'/step1': {
  // next can be a relative string path
  next: 'step2'
},
'/step2': {
  // next can be an array of conditions
  next: [
    // field, op and value. op defaults to '==='
    { field: 'field1', op: '===', value: 'foobar', next: 'conditional-next' },

    // an operator can be a function
    { field: 'field1', op: (fieldValue, req, res, con) => fieldValue === con.value, value: true, next: 'next-step' },

    // next can be an array of conditions
    { field: 'field1', value: 'boobaz', next: [
        { field: 'field2', op: '=', value: 'foobar', next: 'sub-condition-next' },
        'sub-condition-default-next'
    ] },

    // a condition can be a function specified by fn
    { fn: (req, res, con) => true, next: 'functional-condition' },

    // a condition can be a controller method
    { fn: Controller.prototype.conditionMethod, next: 'functional-condition' },

    // a condition can be a controller method specified by name
    { fn: 'conditionMethod', next: 'functional-condition' },

    // the next option can be a function to return a dynamic next step
    { field: 'field1', value: true, next: (req, res, con) => 'functional-next' },

    // use a string as a default next step
    'default-next'
  ]
}
```


## Custom Controllers

Creating a custom controller:

```javascript
// controller.js
const Controller = require('hmpo-form-wizard').Controller;

class CustomController extends Controller {
  /* Custom middleware */
  middlewareSetup() {
    super.middlewareSetup();
    this.use((req, res, next) => {
      console.log(req.method, req.url);
      next();
    });
  }

  /* Overridden locals lifecycle */
  locals(req, res, callback) {
    let locals = super.locals(req, res (err, locals) => {
      locals.newLocal = 'value';
      callback(null, locals);
    });
  }
}

module.exports = CustomController
```

Examples of custom controllers can be found in the [example app](./example/controllers)

## Controller lifecycle
These controllers can be overridden in a custom controller to provide additional behaviour to a standard controller.

[![HMPO Forms Flow](https://user-images.githubusercontent.com/196695/161105955-1cc0837e-22da-4076-a4d6-fb7a95842834.png
)](://github.com/UKHomeOffice/passports-form-wizard/wiki/HMPO%20Forms%20Flow.pdf)

[This diagram]( ://github.com/UKHomeOffice/passports-form-wizard/wiki/HMPO%20Forms%20Flow.pdf) shows the interaction and sequence of these lifecycle events.

### GET lifecycle
> #### - `configure(req, res, next)`
> Allows changing of the `req.form.options` controller options for this request.
> #### - Middleware mixins are run.
> #### - `get(req, res, next)`
>> #### - `errors = getErrors(req, res)`
>> Returns an `Object` of `Controller.Error` validation errors indexed by the field name.
>> #### - `getValues(req, res, callback(err, values))`
>> Calls `callback` with an error and `Object` of field names and values.
>> The values will include user-entered values for the current step if validation fails.
>> #### - `locals(req, res, callback(err, locals))`
>> Calls `callback` with error and `Object` of locals to be used in the rendered template.
>> #### - `render(req, res, next)`
>> Renders the template to the user.

### POST lifecycle
> #### - `configure(req, res, next)`
> Allows changing of the `req.form.options` controller options for this request.
> #### - Middleware mixins are run.
> #### - `post(req, res, next)`
>> #### - `process(req, res, next)`
>> Allows for processing the `req.form.values` before validation.
>> #### - `validateFields(req, res, callback)`
>> Validates each field and calls `callback` with an `Object` of validation errors indexed by field name.
>> #### - `validate(req, res, next)`
>> Allows for additional validation of the `req.form.values` after the built-in field validation.
>> #### - `saveValues(req, res, next)`
>> Saves the values to the session model.
>> #### - `successHandler(req, res, next)`
>> Saves the step into the step history and redirects to the next step.

### Error handling
> #### - `errorHandler(err, req, res, next)`
> Additional error handling can be performed by overriding the `errorHandler`.

## Example app

An example application can be found in [the ./example directory](./example). To run this, follow the instructions in the [README](./example/README.md).

## Session Injection

A helper is provided to aid with session injection:

```javascript
const SessionInjection = require('hmpo-form-wizard').SessionInjection;
app.use('/debug/session', new SessionInjection().middleware());
```

This endpoint `/debug/session` can take a POST of JSON or url encoded data in the format:
```json
{
  "journeyName": "name",
  "journeyKeys": {
    "key": "name"
  },
  "allowedStep": "/full/path",
  "prereqStep": "/full/path",
  "featureFlags": {
    "flag": true
  },
  "wizards": {
    "wizardName": {
        "wizardKey": "value"
    }
  },
  "rawSessionValues": {
    "sessionKey": "value"
  }
}
```

A GET to this endpoint will render a web form that can submit this JSON.

## Migrating to wizard v6

* The code has been updated to es6 and requires a minimum of Node v4
* If additional middleware has been added by overriding the `constructor` or `requestHandler` method, this will need to be moved to one of the middleware setup methods (`middlewareSetup`, `middlewareChecks`, `middlewareActions`, or `middlewareLocals`) (see the Custom Controller example above)
* Custom controllers must be specified using an es6 `class` statement, and not a function.
* When testing custom controllers the mimimum options that need to be supplied is `route`.
* `backLink` and `backLinks` must now be paths relative to the wizard base URL, or full HTTP URLs.
* forks are now unsupported.


## Migrating to wizard v7

* Step history has been moved from a `step` array in the `sessionModel` to a structured `history` array in the `journeyModel`.
* Journey history checking has become stricter. A step will only be allowed if it is an `entryPoint`, it is `next` from an existing step, or a `prereq` is in history. History checking can be disabled with the `checkJourney` option set to false.
* Steps are completed when they are successfully posted to. If your step only has links, set the `noPost` option for it to be set as completed when rendered.
* A `skip` option has been added that will run the `post()` lifecycle methods instead of rendering a template.
* A `reset` option has been added that will reset the wizard `sessionModel`.
* A `resetJourney` option has been added that will reset the `journeyModel` step history.
* If a step isn't allowed and the step history is empty, a `MISSING_PREREQ` error will be thrown that must be dealt with. Previously the user was sent back to a 'first' step of the current wizard.
* Backlinks will automatically populate between wizards on the same journey.
* `next` links and error redirects are  now relative to the `baseUrl`.
* Branching is now supported by `next`. See the Example app for details.
* The app should provide error middleware that redirects to the location specified by the `redirect` property of the error. This is to allow any error to be intercepted before redirection occurs.

## Migrating to wizard v8
* Options are deep cloned to `req.form.options` on every request. These can be mutated by overriding the `configure(req, res, next)` method. Tests may need to be updated to make sure `req.form.options` is set to the same object as the controller options when not running the whole request lifecycle.
* The `noPost` option will now set the step as complete if the `render` method is overridden. Previously this was done by `render`.

## Migrating to wizard v9
* The `hmpo-form-controller` has been merged into the wizard's controller.
* Dependent fields that are hidden are not set to their formatted defaults in `_process` instead of as part of `_validation`
* The interface to the validation library has changed.
* The `locals()` lifecycle event is now called asynchronously if a callback is supplied: `locals(req, res, callback(err, locals))`. The method can still be overwridden synchonrously by only providing a method as `locals(req, res)`.

## Migrating to wizard v11
* Hogan has been removed from the wizard. Error messages are no longer localised and templated by the wizard at validation time. An updated `passports-template-mixins` module is reqiured to translate and format the error messages for both the inline errors and error summary at render time.
