"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
module.exports = mysql;

function mysql(ripple) {
  log("creating");

  if (client) {
    return identity;
  }ripple.db.adaptors.mysql = init(ripple);
  return ripple;
}

function init(ripple) {
  return function (config) {
    var con = require("mysql").createPool(config);

    return {
      push: push(con),
      update: update(con),
      remove: remove(con),
      load: load(con)
    };
  };
}

function push(con) {
  return function (ripple) {
    return function (res, key, value) {
      var p = promise(),
          table = header("table")(res);
      if (!table) return;

      // console.log('push', table, res, key, value)
    };
  };
}

function update(con) {
  return function (ripple) {
    return function (res, key, value) {
      var p = promise(),
          table = header("table")(res);
      if (!table) return;

      // console.log('update', table, res, key, value)
    };
  };
}

function remove(con) {
  return function (ripple) {
    return function (res, key, value) {
      var p = promise(),
          table = header("table")(res);
      if (!table) return;

      // console.log('remove', table, res, key, value)
    };
  };
}

function load(con) {
  return function (ripple) {
    return function (res) {
      var p = promise(),
          table = header("table")(res) || res.name;

      con.query("SHOW TABLES LIKE \"" + table + "\"", function (e, rows) {
        if (e) return err(table, e);
        if (!rows.length) return (log("no table", table), key("headers.table", "")(res));
        key("headers.table", table)(res);

        con.query("SELECT * FROM  " + table, function (e, rows) {
          if (e) return err(table, e);
          log("got", table, rows.length);
          ripple({ name: res.name, body: rows });
        });
      });
    };
  };
}

var promise = _interopRequire(require("utilise/promise"));

var header = _interopRequire(require("utilise/header"));

var client = _interopRequire(require("utilise/client"));

var key = _interopRequire(require("utilise/key"));

var log = _interopRequire(require("utilise/log"));

var err = _interopRequire(require("utilise/err"));

log = log("[ri/mysql]");
err = err("[ri/mysql]");