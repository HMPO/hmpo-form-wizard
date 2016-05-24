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
    next: '/step2'
  },
  '/step2': {
    next: '/step3',
    fields: ['name']
  },
  '/step3': {
    next: '/step4',
    fields: ['age']
  },
  '/step4': {}
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
var wizard = require('hmpo-form-wizard'),
    steps = require('./steps'),
    fields = require('./fields');

app.use(wizard(steps, fields));
```

## Sessions

The wizard expects some kind of session to have been created in previous middleware layers.

For production use a database backed session store is recommended - such as [connect-redis](https://github.com/tj/connect-redis).

### Additional step options

The minimum amount of configuration for a wizard step is the `next` property to determine where the user should be taken after completing a step. A number of additional properties can be defined.

* `fields` - specifies which of the fields from the field definition list are applied to this step. Form inputs which are not named on this list will not be processed. Default: `[]`
* `template` - Specifies the template to render for GET requests to this step. Defaults to the route (without trailing slash)
* `backLink` - Specifies the location of the step previous to this one. If not specified then an algorithm is applied which checks the previously visited steps which have the current step set as `next`.
* `controller` - The constructor for the controller to be used for this step's request handling. The default is an extension of the [hmpo-form-controller](https://www.npmjs.com/package/hmpo-form-controller), which is exported as a `Controller` property of this module. If custom behaviour is required for a particular form step then custom extensions can be defined - see [Custom Controllers](#custom-controllers)
* `forks` - Specifies a list of forks that can be taken depending on a particular field value or conditional function - See  [handling forking journeys](https://github.com/UKHomeOffice/passports-form-controller#handles-journey-forking) in hmpo-form-controller.

### Additional field options

* `invalidates` - an array of field names that will be 'invalidated' when this field value is set or changed. Any fields specified in the `invalidates` array will be removed from the `sessionModel`. Further to this any future steps from the invalidating step field will be removed from the `sessionModel`.

Remaining field options documentation can be found in the hmpo-template-mixins [README](https://github.com/UKHomeOffice/passports-template-mixins#options-1).

### Additional wizard options

A number of options can be passed to the wizard as a third argument to customise aspects of the behaviour for all steps.

`translate` - provide a function for translating validation error codes into usable messages. Previous implementations have used [i18next](https://www.npmjs.com/package/i18next) to do translations.
`templatePath` - provides the location within `app.get('views')` that templates are stored. Default `pages`.
`controller` - override the [default controller](./lib/controller.js) for steps without a controller specified.
`params` - define a suffix for the routes for supporting additional URL parameters.

### Custom Controllers

Creating a custom controller:

```javascript
// controller.js
var util = require('util'),
    Controller = require('hmpo-form-wizard').Controller;

function CustomController() {
  Controller.apply(this, arguments);
  // extra middleware to log the request
  this.use(function (req, res, next) {
    console.log(req.method, req.url);
    next();
  });
}

util.inherits(CustomController)

module.exports = CustomController
```

Examples of custom controllers can be found in the [example app](./example/controllers)

## Example app

An example application can be found in [the ./example directory](./example). To run this, follow the instructions in the [README](./example/README.md).
