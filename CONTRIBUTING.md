# Contribution guidelines

This is currently maintained by HMPO DCS (Digital Customer Services).

## Contributing

If you’ve got an idea or suggestion you can:

* [create a GitHub issue](https://github.com/HMPO/hmpo-form-wizard/issues)

## Raising bugs

When reporting an issue, please include as much detail as possible to help us recreate, discuss, and resolve the problem. Here are some guidelines to follow:

1. **Describe the Issue**: Provide a clear and concise description of the issue. Include any error messages, unexpected behavior, and steps to reproduce the problem.

2. **Environment Details**: Specify the environment in which the issue occurred. This includes:

   * Operating System (e.g., Windows 10, macOS Big Sur, Ubuntu 20.04)
   * Browser and version (if applicable)
   * Node.js version (if applicable)
   * Any other relevant software versions

3. **Minimal Reproducer**: To help us understand and fix the issue faster, please create a minimal reproducer repository. This should be a small, self-contained example that demonstrates the problem. Include:

    * A link to the minimal reproducer repository
    * Detailed reproduction instructions
    * Any notes on the environment setup

4. **Additional Context**: If there are any other details that might help us understand the issue better, please include them. This could be related issues, screenshots, or logs.

When describing the bug it's also useful to follow the format:

* what you did
* what you expected to happen
* what happened

## Suggesting features

Please raise feature requests as issues before contributing any code.

This ensures they are discussed properly before any time is spent on them.

## Contributing code

### Indentation and whitespace

Your JavaScript code should pass linting checks.

We use ESLint with its rules defined by [eslint.config.js](eslint.config.js)
Some useful docs on ESLint can be found here:
* [ESLint - Getting Started](https://eslint.org/docs/latest/use/getting-started)
* [ESLint - CLI Options](https://eslint.org/docs/latest/use/command-line-interface)
* [ESLint for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint#:~:text=If%20you%20haven't%20installed,create%20an%20.eslintrc%20configuration%20file.)

We ask that you maintain 4-space, soft-tabs only indentation.

### Testing

Please ensure unit tests are added or updated as appropriate for your changes.

### Commit hygiene

To keep our commit history clean and easy to follow, we kindly ask that you squash your commits before merging your branch into the main branch. This helps to consolidate changes and makes the history more readable.
