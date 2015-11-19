'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mysql;

var _from = require('utilise/from');

var _from2 = _interopRequireDefault(_from);

var _identity = require('utilise/identity');

var _identity2 = _interopRequireDefault(_identity);

var _promise = require('utilise/promise');

var _promise2 = _interopRequireDefault(_promise);

var _header = require('utilise/header');

var _header2 = _interopRequireDefault(_header);

var _client = require('utilise/client');

var _client2 = _interopRequireDefault(_client);

var _proxy = require('utilise/proxy');

var _proxy2 = _interopRequireDefault(_proxy);

var _wrap = require('utilise/wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _keys = require('utilise/keys');

var _keys2 = _interopRequireDefault(_keys);

var _key = require('utilise/key');

var _key2 = _interopRequireDefault(_key);

var _not = require('utilise/not');

var _not2 = _interopRequireDefault(_not);

var _str = require('utilise/str');

var _str2 = _interopRequireDefault(_str);

var _is = require('utilise/is');

var _is2 = _interopRequireDefault(_is);

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
function mysql(ripple) {
  log('creating');
  strip(ripple.types['application/data']);
  (0, _key2.default)('adaptors.mysql', (0, _wrap2.default)(init(ripple)))(ripple);
  return ripple;
}

function init(ripple) {
  return function (config) {
    var con = require('mysql').createPool(config);
    escape = con.escape.bind(con);

    return {
      push: exec('push')(con),
      update: exec('update')(con),
      remove: exec('remove')(con),
      load: load(con)
    };
  };
}

function exec(type) {
  return function (con) {
    return function (ripple) {
      return function (res, index, value) {
        var p = (0, _promise2.default)(),
            table = (0, _header2.default)('table')(res);

        if (!table) return;
        if (!_is2.default.obj(value)) return;
        var sql = sqls[type](table, (0, _key2.default)(res.headers.fields)(value));

        con.query(sql, function (e, rows) {
          if (e) return err(type, table, 'failed', e);
          log(type.green.bold, table, 'done', rows.insertId ? (0, _str2.default)(rows.insertId).grey : '');

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
      var p = (0, _promise2.default)(),
          table = (0, _header2.default)('table')(res) || res.name;

      con.query('SHOW COLUMNS FROM ' + table, function (e, rows) {
        if (e && e.code == 'ER_NO_SUCH_TABLE') return log('no table', table), (0, _key2.default)('headers.table', '')(res);
        if (e) return err(table, e);
        (0, _key2.default)('headers.fields', rows.map((0, _key2.default)('Field')))(res);
        (0, _key2.default)('headers.table', table)(res);

        con.query('SELECT * FROM ' + table, function (e, rows) {
          if (e) return err(table, e);
          log('got', table, rows.length);
          ripple({ name: res.name, body: rows });
        });
      });
    };
  };
}

var sqls = {
  push: function push(name, body) {
    var template = 'INSERT INTO {table} ({keys}) VALUES ({values});';
    template = template.replace('{table}', name);
    template = template.replace('{keys}', Object.keys(body).filter((0, _not2.default)((0, _is2.default)('id'))).join(','));
    template = template.replace('{values}', Object.keys(body).filter((0, _not2.default)((0, _is2.default)('id'))).map((0, _from2.default)(body)).join(','));
    log(template.grey);
    return template;
  },
  update: function update(name, body) {
    // TODO This should produe a minimal statement via diff
    var template = 'UPDATE {table} SET {kvpairs} WHERE id = {id};';
    template = template.replace('{table}', name);
    template = template.replace('{id}', body['id']);
    template = template.replace('{kvpairs}', Object.keys(body).filter((0, _not2.default)((0, _is2.default)('id'))).map(kvpair(body)).join(','));
    log(template.grey);
    return template;
  },
  remove: function remove(name, body) {
    var template = 'DELETE FROM {table} WHERE id = {id};';
    template = template.replace('{table}', name);
    template = template.replace('{id}', body['id']);
    log(template.grey);
    return template;
  }
};

function kvpair(arr) {
  return function (key) {
    return key + "=" + escape(arr[key]);
  };
}

function strip(type) {
  type.to = (0, _proxy2.default)(type.to, function (_ref) {
    var name = _ref.name;
    var body = _ref.body;
    var headers = _ref.headers;

    var stripped = {};

    (0, _keys2.default)(headers).filter((0, _not2.default)((0, _is2.default)('fields'))).filter((0, _not2.default)((0, _is2.default)('table'))).map(function (header) {
      return stripped[header] = headers[header];
    });

    return {
      name: name,
      body: body,
      headers: stripped
    };
  });
}

var log = require('utilise/log')('[ri/mysql]'),
    err = require('utilise/err')('[ri/mysql]'),
    escape;