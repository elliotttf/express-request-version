'use strict';

const _ = require('lodash');
const createError = require('http-errors');
const semver = require('semver');

const verPattern = '\\d+(\\.\\d+){0,2}[^/]*';

const PRERELEASE_MESSAGE = 'You cannot lock your request to a prerelease version. Use a version range instead.'; // eslint-disable-line max-len

/**
 * Helper method to attempt to convert an invalid semver string into something
 * valid.
 *
 * @param {string} version
 *   The version to attempt to make something valid from.
 *
 * @return {string}
 *   A more valid semver string.
 */
function versionValidish(version) {
  if (semver.valid(version)) {
    return version;
  }

  const [major, minor = '0', patch = '0'] = version.split('.');
  return [major, minor, patch].join('.');
}

module.exports = {
  /**
   * Returns an express middleware that appends a version property to the
   * request object based on path.
   *
   * @param {string} pathPrefix
   *   Optional. A path fragment that appears before the version. Must end with
   *   a '/'.
   *   Default '/'
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by the request
   *   path.
   *
   * @example
   *   const setVersion = require('express-request-version').setByPath;
   *   // Sets version for paths like /base/v1/thing.
   *   app.use(setVersion('/base'));
   */
  setByPath(pathPrefix = '/') {
    const escPPrefix = _.escapeRegExp(pathPrefix);

    const pathRE = new RegExp(`^${escPPrefix}(v?${verPattern})`);

    return (req, res, next) => {
      const matches = req.path.match(pathRE);
      if (matches) {
        const [, matched] = matches;
        req.origVersion = matched;
        req.version = matched;
      }

      next();
    };
  },

  /**
   * Returns an express middleware that appends a matched version and requested
   * version property to the request object based on path.
   *
   * @param {Array} supportedVersions
   *   An array of versions that are supported.
   * @param {string} pathPrefix
   *   Optional. A path fragment that appears before the version.
   *   Default '/'
   * @param {boolean} preventPrereleaseLock
   *   Set to true if you wish to prevent consumers from locking to a prerelease
   *   version. If this is set to true and a locked prerelease is requested the
   *   server will respond with a 400.
   *   Default fase
   * @param {string} prereleaseMessage
   *   Error message to set if a consumer requests a locked prerelease version
   *   when preventPrereleaseLock is set to true.
   *   Default 'You cannot lock your request to a prerelease version. Use a
   *            version range instead.'
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by the request
   *   path.
   *
   * @example
   *   const setVersion = require('express-request-version').setByPath;
   *   // Sets version for paths like /base/v1/thing.
   *   app.use(setVersion('/base'));
   */
  setBySemverPath(
    supportedVersions,
    pathPrefix = '/',
    preventPrereleaseLock = false,
    prereleaseMessage = PRERELEASE_MESSAGE) {
    if (!Array.isArray(supportedVersions) || !supportedVersions.length) {
      throw new Error('You must define at least one supported version to use this middleware.');
    }
    const escPPrefix = _.escapeRegExp(pathPrefix);

    const pathRE = new RegExp(`^${escPPrefix}([~^]?v?${verPattern})`);

    return (req, res, next) => {
      const matches = decodeURIComponent(req.path).match(pathRE);
      if (matches) {
        const [, matched] = matches;

        if (preventPrereleaseLock && semver.prerelease(matched)) {
          return next(createError(400, prereleaseMessage));
        }

        req.origVersion = matched;
        req.version = semver.maxSatisfying(supportedVersions, versionValidish(matched));
      }

      return next();
    };
  },

  /**
   * Returns an express middleware that appends a version property to the
   * request object based on accept headers.
   *
   * @param {string} vndPrefix
   *   A vendor prefix to use with the accept header.
   * @param {string} verSeparator
   *   Optional. The separator to use between the vendor prefix and version.
   *   Default '.'
   * @param {string} suffix
   *   Optional. The accept header suffix. Default '+json'.
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by an accept
   *   header.
   *
   * @example
   *   const setVersion = require('express-request-version').setByAccept;
   *   // Sets version for accept headers like application/vnd.myorg::1+xml.
   *   app.use(setVersion('vnd.myorg', '::', '', '+xml'));
   *   // Sets version for accept headers like application/vnd.myorg::1+json.
   *   app.use(setVersion('vnd.myorg', '::');
   */
  setByAccept(vndPrefix, verSeparator = '.', suffix = '+json') {
    if (!vndPrefix) {
      throw new Error('You must define at least a vendor prefix to use this middleware.');
    }

    const escVndPrefix = _.escapeRegExp(vndPrefix);
    const escVerSeparator = _.escapeRegExp(verSeparator);
    const escSuffix = _.escapeRegExp(suffix);
    const rString =
      `application/${escVndPrefix}${escVerSeparator}(v?${verPattern})${escSuffix}`;
    const acceptRE = new RegExp(rString);

    return (req, res, next) => {
      const accept = req.get('accept') || '';
      const matches = accept.match(acceptRE);
      if (matches) {
        const [, matched] = matches;
        req.origVersion = matched;
        req.version = matched;
      }

      next();
    };
  },

  /**
   * Returns an express middleware that appends a version property to the
   * request object based on accept headers.
   *
   * @param {Array} supportedVersions
   *   An array of versions that are supported.
   * @param {string} vndPrefix
   *   A vendor prefix to use with the accept header.
   * @param {string} verSeparator
   *   Optional. The separator to use between the vendor prefix and version.
   *   Default '.'
   * @param {string} suffix
   *   Optional. The accept header suffix. Default '+json'.
   * @param {boolean} preventPrereleaseLock
   *   Set to true if you wish to prevent consumers from locking to a prerelease
   *   version. If this is set to true and a locked prerelease is requested the
   *   server will respond with a 400.
   *   Default fase
   * @param {string} prereleaseMessage
   *   Error message to set if a consumer requests a locked prerelease version
   *   when preventPrereleaseLock is set to true.
   *   Default 'You cannot lock your request to a prerelease version. Use a
   *            version range instead.'
   *
   * @return {function}
   *   An express middleware that will set req.version as defined by an accept
   *   header.
   *
   * @example
   *   const setVersion = require('express-request-version').setByAccept;
   *   // Sets version for accept headers like application/vnd.myorg::1+xml.
   *   app.use(setVersion('vnd.myorg', '::', '', '+xml'));
   *   // Sets version for accept headers like application/vnd.myorg::1+json.
   *   app.use(setVersion('vnd.myorg', '::');
   */
  setBySemverAccept(
    supportedVersions,
    vndPrefix,
    verSeparator = '.',
    suffix = '+json',
    preventPrereleaseLock = false,
    prereleaseMessage = PRERELEASE_MESSAGE) {
    if (!Array.isArray(supportedVersions) || !supportedVersions.length) {
      throw new Error('You must define at least one supported version to use this middleware.');
    }
    if (!vndPrefix) {
      throw new Error('You must define at least a vendor prefix to use this middleware.');
    }

    const escVndPrefix = _.escapeRegExp(vndPrefix);
    const escVerSeparator = _.escapeRegExp(verSeparator);
    const escSuffix = _.escapeRegExp(suffix);
    const rString =
      `application/${escVndPrefix}${escVerSeparator}([~^]?v?${verPattern})${escSuffix}`;
    const acceptRE = new RegExp(rString);

    return (req, res, next) => {
      const accept = req.get('accept') || '';
      const matches = accept.match(acceptRE);
      if (matches) {
        const [, matched] = matches;

        if (preventPrereleaseLock && semver.prerelease(matched)) {
          return next(createError(400, prereleaseMessage));
        }

        req.origVersion = matched;
        req.version = semver.maxSatisfying(supportedVersions, versionValidish(matched));
      }

      return next();
    };
  },

  /**
   * Validate that the request version is present and supported.
   *
   * @param {Array} supportedVersions
   *   An array of versions that are supported.
   * @param {string} message
   *   Optional. A message to set for the error.
   *   Default 'Unsupported version requested.'.
   *
   * @return {function}
   *   An express middleware to validate the version requested for the route.
   */
  validateVersion(supportedVersions = [], message = 'Unsupported version requested.') {
    if (!Array.isArray(supportedVersions) || !supportedVersions.length) {
      throw new Error('You must define at least one supported version to use this middleware.');
    }

    return (req, res, next) => {
      if (!req.version || supportedVersions.indexOf(req.version) === -1) {
        return next(createError(400, message));
      }

      return next();
    };
  },
};
