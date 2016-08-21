export default function mysql(ripple){
  log('creating')
  var type = ripple.types['application/data']
  type.to = strip(type.to)
  key('adaptors.mysql', d => init(ripple))(ripple)
  return ripple
}

const init = ripple => config => {
  const con = require('mysql').createPool(config)
  escape = con.escape.bind(con)
  return {
    update: crud(ripple, con)('update')
  , remove: crud(ripple, con)('remove')
  , add   : crud(ripple, con)('add')
  , load  : load(ripple, con)
  // change: change(ripple, con)
  }
}

const crud = (ripple, con) => type => (name, record) => {
  let res    = ripple.resources[name]
    , table  = header('mysql.table')(res)
    , fields = header('mysql.fields')(res)
    , p      = promise()
    , sql

  if (!table) return deb('no table', name)
  if (!(sql = sqls[type](table, key(fields)(record)))) return deb('no sql', name)
  log('SQL', sql.grey)

  con.query(sql, (e, rows) => {
    if (e) return err(type, table, 'failed', e)
    log(type.green.bold, table, 'done', rows.insertId ? str(rows.insertId).grey : '')
    p.resolve(rows.insertId || record.id)
  })

  return p
}

// const change = (ripple, con) => type => (res, change) => {
//   let levels = (change.key || '').split('.')
//     , xto    = header('mysql.xto')(res)
//     , index  = levels[0]
//     , field  = levels[1]
//     , record = change.value

//   if (!change.key) return load(ripple, con)(res)
//   if (!levels.length || levels.length > 2 || (field && !is.in(fields)(field))) return deb('cannot update', name, key)
//   if (xto && !xto(res, change)) return deb('skipping update', name)
//   if (field) record = key(['id', field])(res.body[index])
//   crud(ripple, con)(type)(res.name, record)
// }

const load = (ripple, con) => name => { 
  const res = ripple.resources[name]
      , table = header('mysql.table')(res) || res.name
      , p = promise()
  
  con.query(`SHOW COLUMNS FROM ${table}`, (e, rows) => {
    if (e && e.code == 'ER_NO_SUCH_TABLE') return log('no table', table), key('headers.mysql.table', '')(res)
    if (e) return err(table, e)
    key('headers.mysql.fields', rows.map(key('Field')))(res)
    key('headers.mysql.table', table)(res)

    con.query(`SELECT * FROM ${table}`, (e, rows) => {
      if (e) return err(table, e)
      log('got'.green, table, str(rows.length).grey)
      p.resolve(rows)
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

const strip = next => req => {
  const headers = {}

  keys(req.headers)
    .filter(not(is('mysql')))
    .map(copy(req.headers, headers))

  req.headers = headers
  return (next || identity)(req)
}

import { default as from } from 'utilise/from'
import identity from 'utilise/identity'
import promise from 'utilise/promise'
import prepend from 'utilise/prepend'
import append from 'utilise/append'
import header from 'utilise/header'
import copy from 'utilise/copy'
import keys from 'utilise/keys'
import noop from 'utilise/noop'
import key from 'utilise/key'
import not from 'utilise/not'
import str from 'utilise/str'
import is from 'utilise/is'
const log = require('utilise/log')('[ri/mysql]')
    , err = require('utilise/err')('[ri/mysql]')
    , deb = require('utilise/deb')('[ri/mysql]')
var escape