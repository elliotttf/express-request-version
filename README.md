# Express Request Version

This middleware allows a version property to be added to an express request object and provides
basic version validation.

The resulting version will exist in the `req.version` property of all request objects.

## Usage

### Version by path

Versions can be detected by path:

```javascript
var setVersion = require('express-request-version').setByPath;
// Sets version for paths like /base/v1/thing.
app.use(setVersion('/base'));
```

### Version by accept header

Versions can also be detected by accept header:

```javascript
var setVersion = require('express-request-version').setByAccept;
// Sets version for accept headers like application/vnd.myorg::1+xml.
app.use(setVersion('vnd.myorg', '::', '', '+xml'));
// Sets version for accept headers like application/vnd.myorg::1+json.
app.use(setVersion('vnd.myorg', '::');
```

## Version validation

You can define a set of supported versions, and raise an error if a request is made with an
unsupported version:

```javascript
var validateVersion = require('express-request-version').validateVersion;

// Will call next with an error if a request is made with a version other than
// one of those listed here.
app.use(validateVersion([ 'v1', 'v1.1', 'v1.1.1', 'v2' ]));
```

