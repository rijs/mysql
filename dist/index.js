'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mysql;

var _from = require('utilise/from');

var _from2 = _interopRequireDefault(_from);

var _promise = require('utilise/promise');

var _promise2 = _interopRequireDefault(_promise);

var _prepend = require('utilise/prepend');

var _prepend2 = _interopRequireDefault(_prepend);

var _append = require('utilise/append');

var _append2 = _interopRequireDefault(_append);

var _header = require('utilise/header');

var _header2 = _interopRequireDefault(_header);

var _client = require('utilise/client');

var _client2 = _interopRequireDefault(_client);

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
  var type = ripple.types['application/data'];
  type.to = strip(type.to);
  (0, _key2.default)('adaptors.mysql', function (d) {
    return init(ripple);
  })(ripple);
  return ripple;
}

var init = function init(ripple) {
  return function (config) {
    var con = require('mysql').createPool(config);
    escape = con.escape.bind(con);

    return {
      add: exec('add')(con),
      update: exec('update')(con),
      remove: exec('remove')(con)
    };
  };
};

var exec = function exec(type) {
  return function (con) {
    return function (ripple) {
      return function (res, index, value) {
        var table = (0, _header2.default)('mysql.table')(res),
            xto = (0, _key2.default)('headers.mysql.to')(res),
            p = (0, _promise2.default)();

        if (xto && !xto(res, { key: index, value: value, type: type })) return;
        if (!index) return load(con)(ripple)(res);
        if (!table) return;

        var levels = index.split('.'),
            record = levels.length === 1 ? (levels.shift(), value) : res.body[levels.shift()],
            field = levels.shift();

        if (field) record = (0, _key2.default)(['id', field])(record);
        if (!_is2.default.obj(record) || levels.length || field && !_is2.default.in(res.headers.mysql.fields)(field)) return log('cannot generate SQL for', res.name, index);

        var sql = sqls[type](table, (0, _key2.default)(res.headers.mysql.fields)(record));
        log('SQL', sql.grey);
        con.query(sql, function (e, rows) {
          if (e) return err(type, table, 'failed', e);
          log(type.green.bold, table, 'done', rows.insertId ? (0, _str2.default)(rows.insertId).grey : '');

          rows.insertId ? p.resolve(value.id = rows.insertId) : p.resolve();
        });

        return p;
      };
    };
  };
};

var load = function load(con) {
  return function (ripple) {
    return function (res) {
      var table = (0, _header2.default)('mysql.table')(res) || res.name,
          p = (0, _promise2.default)();

      if ((0, _key2.default)(loaded)(res)) return;
      (0, _key2.default)(loaded, true)(res);

      con.query('SHOW COLUMNS FROM ' + table, function (e, rows) {
        if (e && e.code == 'ER_NO_SUCH_TABLE') return log('no table', table), (0, _key2.default)('headers.mysql.table', '')(res);
        if (e) return err(table, e);
        (0, _key2.default)('headers.mysql.fields', rows.map((0, _key2.default)('Field')))(res);
        (0, _key2.default)('headers.mysql.table', table)(res);

        con.query('SELECT * FROM ' + table, function (e, rows) {
          if (e) return err(table, e);
          log('got', table, rows.length);
          ripple({ name: res.name, body: rows });
        });
      });
    };
  };
};

var sqls = {
  add: function add(name, body) {
    return 'INSERT INTO {table} ({keys}) VALUES ({values});'.replace('{table}', name).replace('{keys}', (0, _keys2.default)(body).filter((0, _not2.default)((0, _is2.default)('id'))).map((0, _prepend2.default)('`')).map((0, _append2.default)('`')).join(',')).replace('{values}', (0, _keys2.default)(body).filter((0, _not2.default)((0, _is2.default)('id'))).map((0, _from2.default)(body)).map(escape).join(','));
  },
  update: function update(name, body) {
    return 'UPDATE {table} SET {kvpairs} WHERE id = {id};'.replace('{table}', name).replace('{id}', body['id']).replace('{kvpairs}', (0, _keys2.default)(body).filter((0, _not2.default)((0, _is2.default)('id'))).map(kvpair(body)).join(','));
  },
  remove: function remove(name, body) {
    return 'DELETE FROM {table} WHERE id = {id};'.replace('{table}', name).replace('{id}', body['id']);
  }
};

var kvpair = function kvpair(arr) {
  return function (key) {
    return '`' + key + "`=" + escape(arr[key]);
  };
};

var strip = function strip(next) {
  return function (res, change) {
    if (change) return next ? next.call(this, res, change) : true;
    var rep = { name: res.name, body: res.body, headers: {} };

    (0, _keys2.default)(res.headers).filter((0, _not2.default)((0, _is2.default)('mysql'))).map(function (header) {
      return rep.headers[header] = res.headers[header];
    });

    return next ? next.call(this, rep, change) : rep;
  };
};

var loaded = 'headers.mysql.loaded',
    log = require('utilise/log')('[ri/mysql]'),
    err = require('utilise/err')('[ri/mysql]');
var escape;