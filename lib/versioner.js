var _ = require('lodash');
var createError = require('http-errors');

var versionPattern = '\\d+(\\.\\d+){0,2}';

module.exports = {
  /**
   * Returns an express middleware that appends a version property to the
   * request object based on path.
   *
   * @param {string} pathPrefix
   *   Optional. A path fragment that appears before the version.
   *   Default '/'
   * @param {string} versionPrefix
   *   Optional. The prefix for versions in the header.
   *   Default 'v'
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by the request
   *   path.
   *
   * @example
   *   var setVersion = require('express-request-version').setByPath;
   *   // Sets version for paths like /base/v1/thing.
   *   app.use(setVersion('/base'));
   */
  setByPath: function (pathPrefix, versionPrefix) {
    pathPrefix = _.escapeRegExp(pathPrefix || '/');
    versionPrefix = _.escapeRegExp(versionPrefix || 'v');

    var pathRE = new RegExp([
      '^',
      pathPrefix,
      '(',
      versionPrefix,
      versionPattern,
      ')'
    ].join(''));

    return function (req, res, next) {
      var matches = req.path.match(pathRE);
      if (matches) {
        req.version = matches[1];
      }

      next();
    };
  },

  /**
   * Returns an express middleware that appends a version property to the
   * request object based on accept headers.
   *
   * @param {string} vendorPrefix
   *   A vendor prefix to use with the accept header.
   * @param {string} versionSeparator
   *   Optional. The separator to use between the vendor prefix and version.
   *   Default '.'
   * @param {string} versionPrefix
   *   Optional. The prefix for versions in the header. Default 'v'.
   * @param {string} suffix
   *   Optional. The accept header suffix. Default '+json'.
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by an accept
   *   header.
   *
   * @example
   *   var setVersion = require('express-request-version').setByAccept;
   *   // Sets version for accept headers like application/vnd.myorg::1+xml.
   *   app.use(setVersion('vnd.myorg', '::', '', '+xml'));
   *   // Sets version for accept headers like application/vnd.myorg::1+json.
   *   app.use(setVersion('vnd.myorg', '::');
   */
  setByAccept: function (vendorPrefix, versionSeparator, versionPrefix, suffix) {
    if (!vendorPrefix) {
      throw new Error('You must define at least a vendor prefix to use this middleware.');
    }

    vendorPrefix = _.escapeRegExp(vendorPrefix);
    versionSeparator = _.escapeRegExp(versionSeparator || '.');
    versionPrefix = _.escapeRegExp(versionPrefix || 'v');
    suffix = _.escapeRegExp(suffix || '+json');
    var acceptRE = new RegExp([
      'application\/',
      vendorPrefix,
      versionSeparator,
      '(',
      versionPrefix,
      versionPattern,
      ')',
      suffix
    ].join(''));

    return function (req, res, next) {
      var matches;
      var accept = req.get('accept');

      if (accept && (matches = accept.match(acceptRE))) {
        req.version = matches[1];
      }

      next();
    };
  },

  /**
   * Validate that the request version is present and supported.
   *
   * @param {array} supportedVersions
   *   An array of versions that are supported.
   * @param {string} message
   *   Optional. A message to set for the error.
   *   Default 'Unsupported version requested.'.
   *
   * @return {function}
   *   An express middleware to validate the version requested for the route.
   */
  validateVersion: function (supportedVersions, message) {
    if (!supportedVersions || !Array.isArray(supportedVersions) || supportedVersions.length === 0) {
      throw new Error('You must define at least one supported version to use this middleware.');
    }

    message = message || 'Unsupported version requested.';
    return function (req, res, next) {
      if (!req.version || supportedVersions.indexOf(req.version) === -1) {
        return next(createError(400, message));
      }

      next();
    };
  }
};

