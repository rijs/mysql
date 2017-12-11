export default function mysql(config, opts = {}){
  log('creating')

  config = extend(opts)({
    type    : (config = config.split('://')).shift()
  , user    : (config = config.join('://').split(':')).shift()
  , database: (config = config.join(':').split('/')).pop()
  , port    : (config = config.join('/').split(':')).pop()
  , host    : (config = config.join(':').split('@')).pop()
  , password: config.join('@')
  })

  const con = createPool(config)
  escape = con.escape.bind(con)

  return {
    update: crud(con, 'update')
  , remove: crud(con, 'remove')
  , add   : crud(con, 'add')
  , addID   : crud(con, 'addID')
  , load  : load(con)
  , query : query(con)
  }
}

const query = con => (sql, params = []) => new Promise((resolve, reject) => {
  log('SQL (query)', sql.grey, params)

  con.query(sql, params, (e, results) => e
    ? reject(err(sql, 'failed', e))
    : resolve(results)
  )
})

const crud = (con, type) => (table, body) => {
  let p = promise()
    , mask = fields[table]
    , sql

  if (!(sql = sqls[type](table, key(mask)(body)))) return deb('no sql', table)
  log('SQL', sql.grey)

  con.query(sql, (e, rows) => {
    if (e) return err(type, table, 'failed', e), p.reject(e)
    log(type.green.bold, table, 'done', rows.insertId ? str(rows.insertId).grey : '')
    p.resolve(rows.insertId || body.id)
  })

  return p
}

const load = con => (table, id) => { 
  const p = promise()
  
  con.query(`SHOW COLUMNS FROM ${table}`, (e, rows) => {
    if (e && e.code == 'ER_NO_SUCH_TABLE') return log('no table', table)
    if (e) return err(table, e)
    key(table, rows.map(key('Field')))(fields)
  
    con.query(id ? `SELECT * FROM ${table} WHERE id = ${id}` : `SELECT * FROM ${table}`, (e, rows) => {
      if (e) return err(table, e)
      log('got'.green, table, str(rows.length).grey)
      p.resolve(id ? rows[0] : rows)
    })
  })

  return p
}

const sqls = {
  add(name, body) { return 'INSERT INTO {table} ({keys}) VALUES ({values});'
    .replace('{table}', name)
    .replace('{keys}', keys(body)
      .filter(not(is('id')))
      .map(prepend('`'))
      .map(append('`'))
      .join(',')
    )
    .replace('{values}', keys(body)
      .filter(not(is('id')))
      .map(from(body))
      .map(escape)
      .join(',')
    )
  }
, addID(name, body) { return 'INSERT INTO {table} ({keys}) VALUES ({values});'
    .replace('{table}', name)
    .replace('{keys}', keys(body)
      .map(prepend('`'))
      .map(append('`'))
      .join(',')
    )
    .replace('{values}', keys(body)
      .map(from(body))
      .map(escape)
      .join(',')
    )
  }
, update(name, body) { return keys(body).length == 1 && ('id' in body) ? ''
  : 'UPDATE {table} SET {kvpairs} WHERE id = {id};'
      .replace('{table}', name)
      .replace('{id}', body['id'])
      .replace('{kvpairs}', keys(body)
        .filter(not(is('id')))
        .map(kvpair(body))
        .join(',')
      )
  }
, remove(name, body) { return 'DELETE FROM {table} WHERE id = {id};'
    .replace('{table}', name)
    .replace('{id}', body['id'])
  }
}

const kvpair = arr => key => '`' + key + "`=" + escape(arr[key])

import { default as from } from 'utilise/from'
import promise from 'utilise/promise'
import prepend from 'utilise/prepend'
import extend from 'utilise/extend'
import append from 'utilise/append'
import keys from 'utilise/keys'
import key from 'utilise/key'
import not from 'utilise/not'
import str from 'utilise/str'
import is from 'utilise/is'
import { createPool } from 'mysql'
const log = require('utilise/log')('[mysql]')
    , err = require('utilise/err')('[mysql]')
    , deb = require('utilise/deb')('[mysql]')
    , fields = {}
var escape