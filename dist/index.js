"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
module.exports = mysql;

function mysql(ripple) {
  log("creating");

  /* istanbul ignore next */
if (client) {
    return identity;
  }strip(ripple.types["application/data"]);
  ripple.db.adaptors.mysql = init(ripple);
  return ripple;
}

function init(ripple) {
  return function (config) {
    var con = require("mysql").createPool(config);
    escape = con.escape.bind(con);

    return {
      push: exec("push")(con),
      update: exec("update")(con),
      remove: exec("remove")(con),
      load: load(con)
    };
  };
}

function exec(type) {
  return function (con) {
    return function (ripple) {
      return function (res, index, value) {
        var p = promise(),
            table = header("table")(res);

        if (!table) return;
        if (!is.obj(value)) return;
        var sql = sqls[type](table, key(res.headers.fields)(value));

        con.query(sql, function (e, rows) {
          if (e) return err(type, table, "failed", e);
          log(type.green.bold, table, "done", rows.insertId ? str(rows.insertId).grey : "");

          rows.insertId ? p.resolve(value.id = rows.insertId) : p.resolve();
        });

        return p;
      };
    };
  };
}

function load(con) {
  return function (ripple) {
    return function (res) {
      var p = promise(),
          table = header("table")(res) || res.name;

      con.query("SHOW COLUMNS FROM " + table, function (e, rows) {
        if (e && e.code == "ER_NO_SUCH_TABLE") return (log("no table", table), key("headers.table", "")(res));
        if (e) return err(table, e);
        key("headers.fields", rows.map(key("Field")))(res);
        key("headers.table", table)(res);

        con.query("SELECT * FROM " + table, function (e, rows) {
          if (e) return err(table, e);
          log("got", table, rows.length);
          ripple({ name: res.name, body: rows });
        });
      });
    };
  };
}

var sqls = {
  push: function push(name, body) {
    var template = "INSERT INTO {table} ({keys}) VALUES ({values});";
    template = template.replace("{table}", name);
    template = template.replace("{keys}", Object.keys(body).filter(not(is("id"))).join(","));
    template = template.replace("{values}", Object.keys(body).filter(not(is("id"))).map(value(body)).join(","));
    log(template.grey);
    return template;
  },
  update: function update(name, body) {
    // TODO This should produe a minimal statement via diff
    var template = "UPDATE {table} SET {kvpairs} WHERE id = {id};";
    template = template.replace("{table}", name);
    template = template.replace("{id}", body.id);
    template = template.replace("{kvpairs}", Object.keys(body).filter(not(is("id"))).map(kvpair(body)).join(","));
    log(template.grey);
    return template;
  },
  remove: function remove(name, body) {
    var template = "DELETE FROM {table} WHERE id = {id};";
    template = template.replace("{table}", name);
    template = template.replace("{id}", body.id);
    log(template.grey);
    return template;
  }
};

function value(arr) {
  return function (key) {
    return escape(arr[key]);
  };
}

function kvpair(arr) {
  return function (key) {
    return key + "=" + escape(arr[key]);
  };
}

function strip(type) {
  type.to = proxy(type.to || identity, function (_ref) {
    var name = _ref.name;
    var body = _ref.body;
    var headers = _ref.headers;

    return {
      name: name,
      body: body,
      headers: key(["content-type", "cache"])(headers)
    };
  });
}

var identity = _interopRequire(require("utilise/identity"));

var promise = _interopRequire(require("utilise/promise"));

var header = _interopRequire(require("utilise/header"));

var client = _interopRequire(require("utilise/client"));

var proxy = _interopRequire(require("utilise/proxy"));

var key = _interopRequire(require("utilise/key"));

var log = _interopRequire(require("utilise/log"));

var err = _interopRequire(require("utilise/err"));

var not = _interopRequire(require("utilise/not"));

var str = _interopRequire(require("utilise/str"));

var is = _interopRequire(require("utilise/is"));

log = log("[ri/mysql]");
err = err("[ri/mysql]");
var escape;