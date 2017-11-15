# Express Request Version

[![Greenkeeper badge](https://badges.greenkeeper.io/elliotttf/express-request-version.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/elliotttf/express-request-version.svg?branch=master)](https://travis-ci.org/elliotttf/express-request-version)
[![Coverage Status](https://coveralls.io/repos/elliotttf/express-request-version/badge.svg?branch=master)](https://coveralls.io/r/elliotttf/express-request-version?branch=master)

This middleware allows a version property to be added to an express request object and provides
basic version validation.

The resulting version will exist in the `req.version` property of all request objects.

In the case of semver routing a best effort is made to match the requested version with
the supported versions. The original requested version will be placed in `req.origVersion`.

## Usage

### Version by path

Versions can be detected by path:

```javascript
var setVersion = require('express-request-version').setByPath;
// Sets version for paths like /base/v1/thing.
app.use(setVersion('/base/'));
```

### Version by semver path

Versions can be detected by semvers in the path:

```javascript
var setVersion = require('express-request-version').setBySemverPath;
// Sets version for paths like /base/^v1.0.0/thing.
app.use(setVersion(['v1.0.0', 'v1.1.1', 'v2.0.0'], '/base/'));
```

### Version by accept header

Versions can be detected by accept header:

```javascript
var setVersion = require('express-request-version').setByAccept;
// Sets version for accept headers like application/vnd.myorg::1+xml.
app.use(setVersion('vnd.myorg', '::', '+xml'));
// Sets version for accept headers like application/vnd.myorg::1+json.
app.use(setVersion('vnd.myorg', '::');
```

### Version by accept semver header

Versions can be detected by accept header with semvers:

```javascript
var setVersion = require('express-request-version').setBySemverAccept;
// Sets version for accept headers like application/vnd.myorg::^1.0.0+xml.
app.use(setVersion(['v1.0.0', 'v1.1.1', 'v2.0.0'], 'vnd.myorg', '::', '+xml'));
// Sets version for accept headers like application/vnd.myorg::~1.0.0+json.
app.use(setVersion(['v1.0.0', 'v1.1.1', 'v2.0.0'], 'vnd.myorg', '::');
```

### Version validation

You can define a set of supported versions, and raise an error if a request is made with an
unsupported version:

```javascript
var validateVersion = require('express-request-version').validateVersion;

// Will call next with an error if a request is made with a version other than
// one of those listed here.
app.use(validateVersion([ 'v1', 'v1.1', 'v1.1.1', 'v2' ]));
```

## Helper function
In your controller files, you can add support for multiple versions by importing the
`multiVersion` helper:
```javascript
var multiVersion = require('express-request-version').multiVersion;
...
router.get(
'/myPath',
[other middleware],
multiVersion({
  '*': version1,
  'v0.1.0': version2,
}))

function version1(req, res) {
  res.send('This is version 1!')
}

function version2(req, res) {
  res.send('This is version 2!')
}
```
Note that a default version marked with `'*'` is mandatory.

## API

  * `setByPath(pathPrefix = '/')` - Returns an express middleware that appends a
    version property to the request object based on path.
    * `pathPrefix` - Optional. A path fragment that appears before the version.
      Must end with a `/`.
  * `setBySemverPath(supportedVersions, pathPrefix = '/', preventPrereleaseLock = false, prereleaseMessage = PRERELEASE_MESSAGE)` - Returns an express
    middleware that appends a matched version and requested version property to the
    request object based on path.
    * `supportedVersions` - An array of versions that are supported.
    * `pathPrefix` - Optional. A path fragment that appears before the version.
      Must end with a `/`.
    * `preventPrereleaseLock` - Optional. Set to true if you wish to prevent
      consumers from locking to a prerelease version. If this is set to true and
      a locked prerelease is requested the server will respond with a 400.
      Default `false`
    * `prereleaseMessage` - Error message to set if a consumer requests a locked
      prerelease version when preventPrereleaseLock is set to true.
      Default `'You cannot lock your request to a prerelease version. Use a version range instead.'`
  * `setByAccept(vndPrefix, verSeparator = '.', suffix = '+json')` - Returns an
    express middleware that appends a version property to the request object based
    on accept headers.
    * `vndPrefix` - A vendor prefix to use with the accept header.
    * `verSeparator` - Optional. The separator to use between the vendor prefix
      and version.
    * `suffix` - Optional. The accept header suffix. Default '+json'.
  * `setBySemverAccept(supportedVersions, vndPrefix, verSeparator = '.', suffix = '+json', preventPrereleaseLock = false, prereleaseMessage = PRERELEASE_MESSAGE)` -
    Returns an express middleware that appends a version property to the request
    object based on accept headers.
    * `supportedVersions` - An array of versions that are supported.
    * `vndPrefix` - A vendor prefix to use with the accept header.
    * `verSeparator` - Optional. The separator to use between the vendor prefix
      and version.
    * `suffix` - Optional. The accept header suffix. Default '+json'.
    * `preventPrereleaseLock` - Optional. Set to true if you wish to prevent
      consumers from locking to a prerelease version. If this is set to true and
      a locked prerelease is requested the server will respond with a 400.
      Default `false`
    * `prereleaseMessage` - Error message to set if a consumer requests a locked
      prerelease version when preventPrereleaseLock is set to true.
      Default `'You cannot lock your request to a prerelease version. Use a version range instead.'`
  * `validateVersion(supportedVersions = [], message = 'Unsupported version requested.')` -
    Validate that the request version is present and supported.
    * `supportedVersions` - An array of versions that are supported.
    * `message` - Optional. A message to set for the error.
