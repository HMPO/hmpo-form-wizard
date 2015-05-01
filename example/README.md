# Example

## Installing and running

```
$> npm install
$> npm start
```

Then open http://localhost:3000/ in a browser.

## Configuring

By default the form will POST a json paylod representing the form data to http://localhost:3000/api on completion. To change this endpoint run the app with an environment variable of `API_URL` containing the required endpoint.

```
$> API_URL=http://example.com/api npm start
```

To run on a different port set a `PORT` environment variable.
```
$> PORT=8080 npm start
```
