# Example

> **⚠️ Compatibility Note**: If you encounter a `path-to-regexp` error when starting this example, it's likely due to Express v5.x compatibility issues. Pin Express to a v4.x version in package.json by changing `"express": "latest"` to `"express": "^4.21.2"`. This is due to breaking changes in Express v5.x that affect route parameter parsing.

## Installing and running

```
$> npm install
$> npm start
```

Then open http://localhost:3000/ in a browser.

## Configuring

By default the form will POST a json paylod representing the form data to http://localhost:3000/api on completion.

