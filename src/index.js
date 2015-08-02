// -------------------------------------------
// Loads resources from the /resources folder
// -------------------------------------------
export default function mysql(ripple){
  log('creating')
  
  if (client) return identity
  ripple.db.adaptors.mysql = init(ripple)
  return ripple
}

function init(ripple) {
  return config => {
    var con = require('mysql').createPool(config)
    escape = con.escape.bind(con)
    
    return {
      push: exec('push')(con)
    , update: exec('update')(con)
    , remove: exec('remove')(con)
    , load: load(con)
    }
  }
}

function exec(type) {
  return (con) => {
    return (ripple) => {
      return (res, key, value) => {
        var p = promise()
          , table = header('table')(res)
          
        if (!table) return
        if (!is.obj(value)) return

        var sql = sqls[type](table, value)

        con.query(sql, function(e, rows) {
          if (e) return err(type, table, 'failed', e)
          log(type.green.bold, table, 'done', rows.insertId ? str(rows.insertId).grey : '')
          p.resolve(rows.insertId ? (value.id = rows.insertId) : '')
        })

        return p
      }
    }
  }
}

function load(con){
  return (ripple) => {
    return (res) => {
      var p = promise(), table = header('table')(res) || res.name
      
      con.query(`SHOW TABLES LIKE "${table}"`, function(e, rows) {
        if (e) return err(table, e)
        if (!rows.length) return log('no table', table), key('headers.table', '')(res)
        key('headers.table', table)(res)

        con.query(`SELECT * FROM ${table}`, function(e, rows) {
          if (e) return err(table, e)
          log('got', table, rows.length)
          ripple({ name: res.name, body: rows })
        })

      })

    }
  }
}

var sqls = {
  push: function(name, body) {
    var template = 'INSERT INTO {table} ({keys}) VALUES ({values});'
    template = template.replace('{table}', name)
    template = template.replace('{keys}', Object
      .keys(body)
      .filter(not(is('id')))
      .join(',')
    )
    template = template.replace('{values}', Object
      .keys(body)
      .filter(not(is('id')))
      .map(value(body))
      .map(prepend("'"))
      .map(append("'"))
      .join(',')
    )
    log(template.grey)
    return template
  }
, update: function(name, body) {
    var template = 'UPDATE {table} SET {kvpairs} WHERE id = {id};'
    template = template.replace('{table}', name)
    template = template.replace('{id}', body['id'])
    template = template.replace('{kvpairs}', Object
      .keys(body)
      .filter(not(is('id')))
      .map(kvpair(body))
      .join(',')
    )
    log(template.grey)
    return template
  }
, remove: function(name, body) {
    var template = 'DELETE FROM {table} WHERE id = {id};'
    template = template.replace('{table}', name)
    template = template.replace('{id}', body['id'])
    log(template.grey)
    return template
  }
}

function value(arr) {
  return function(key){
    return escape(arr[key])
  }
}

function kvpair(arr) {
  return function(key){
    return key+"='"+escape(arr[key])+"'"
  }
}

import promise from 'utilise/promise'
import prepend from 'utilise/prepend'
import append from 'utilise/append'
import header from 'utilise/header'
import client from 'utilise/client'
import key from 'utilise/key'
import log from 'utilise/log'
import err from 'utilise/err'
import not from 'utilise/not'
import str from 'utilise/str'
import is from 'utilise/is'
log = log('[ri/mysql]')
err = err('[ri/mysql]')
var escape