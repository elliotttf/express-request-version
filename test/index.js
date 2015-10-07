var version = require('../lib/versioner');
module.exports = {
  setByPath: {
    default: function (test) {
      test.expect(4);

      var middleware = version.setByPath();
      var req = {path: '/v1/foo'};
      middleware(req, {}, function () {
        test.equal(req.version, 'v1', 'Version not set correctly by path.');

        req.path = '/v1.1/foo';
        middleware(req, {}, function () {
          test.equal(req.version, 'v1.1');

          req.path = '/v1.1.1/foo';
          middleware(req, {}, function () {
            test.equal(req.version, 'v1.1.1');

            req.path = '/foo';
            delete req.version;
            middleware(req, {}, function () {
              test.equal(typeof req.version, 'undefined');
              test.done();
            });
          });
        });
      });
    },
    withPathPrefix: function (test) {
      test.expect(1);

      var middleware = version.setByPath('/prefix/');
      var req = {path: '/prefix/v1/foo'};
      middleware(req, {}, function () {
        test.equal(req.version, 'v1', 'Version not set correctly by path.');
        test.done();
      });
    },
    withVersionPrefix: function (test) {
      test.expect(1);

      var middleware = version.setByPath(null, 'a');
      var req = {path: '/a1/foo'};
      middleware(req, {}, function () {
        test.equal(req.version, 'a1', 'Version not set correctly by path.');
        test.done();
      });
    }
  },
  setByAccept: {
    setUp: function (cb) {
      this.req = {
        get: function (key) {
          return this[key];
        }
      };

      cb();
    },

    missingVendorPrefix: function (test) {
      test.expect(1);

      test.throws(function () {
        version.setByAccept();
      }, 'Middleware instantiated without vendor prefix.');
      test.done();
    },
    default: function (test) {
      test.expect(4);

      var middleware = version.setByAccept('vnd.test');

      this.req.accept = 'application/vnd.test.v1+json';

      middleware(this.req, {}, function () {
        test.equal(this.req.version, 'v1', 'Version not set correctly by accept header.');
        this.req.accept = 'application/vnd.test.v1.1+json';
        middleware(this.req, {}, function () {
          test.equal(this.req.version, 'v1.1', 'Version not set correctly by accept header.');

          this.req.accept = 'application/vnd.test.v1.1.1+json';
          middleware(this.req, {}, function () {
            test.equal(this.req.version, 'v1.1.1', 'Version not set correctly by accept header.');

            delete this.req.accept;
            delete this.req.version;
            middleware(this.req, {}, function () {
              test.equal(typeof this.req.version, 'undefined');
              test.done();
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    },
    withSeparator: function (test) {
      test.expect(1);

      var middleware = version.setByAccept('vnd.test', '::');
      this.req.accept = 'application/vnd.test::v1+json';

      middleware(this.req, {}, function () {
        test.equal(this.req.version, 'v1', 'Version not set correctly by accept header.');
        test.done();
      }.bind(this));
    },
    withPrefix: function (test) {
      test.expect(1);

      var middleware = version.setByAccept('vnd.test', null, 'a');
      this.req.accept = 'application/vnd.test.a1+json';

      middleware(this.req, {}, function () {
        test.equal(this.req.version, 'a1', 'Version not set correctly by accept header.');
        test.done();
      }.bind(this));
    },
    withEmptyPrefix: function (test) {
      test.expect(1);

      var middleware = version.setByAccept('vnd.test', null, '');
      this.req.accept = 'application/vnd.test.1+json';

      middleware(this.req, {}, function () {
        test.equal(this.req.version, '1', 'Version not set correctly by accept header.');
        test.done();
      }.bind(this));
    },
    withSuffix: function (test) {
      test.expect(1);

      var middleware = version.setByAccept('vnd.test', null, null, '+xml');
      this.req.accept = 'application/vnd.test.v1+xml';

      middleware(this.req, {}, function () {
        test.equal(this.req.version, 'v1', 'Version not set correctly by accept header.');
        test.done();
      }.bind(this));
    }
  },
  validate: {
    missingVersions: function (test) {
      test.expect(3);

      test.throws(function () {
        version.validateVersion();
      }, 'Undefined versions allowed.');
      test.throws(function () {
        version.validateVersion('foo');
      }, 'Non array versions allowed.');
      test.throws(function () {
        version.validateVersion([]);
      }, 'Empty versions allowed.');

      test.done();
    },
    default: function (test) {
      test.expect(2);

      var middleware = version.validateVersion(['v1', 'v2', 'v3']);

      var req = {version: 'v1'};
      middleware(req, {}, function (err) {
        test.ok(!err, 'Version validated.');

        req.version = 'a1';
        middleware(req, {}, function (err) {
          test.equal(err.status, 400, 'Error status not set.');
          test.done();
        });
      });
    },
    withMessage: function (test) {
      test.expect(1);

      var middleware = version.validateVersion(['v1'], 'Whoops');

      var req = {version: 'a1'};
      middleware(req, {}, function (err) {
        test.equal('Whoops', err.message, 'Error message not set.');
        test.done();
      });
    }
  }
};

