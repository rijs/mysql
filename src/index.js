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
    
    return {
      push: push(con)
    , update: update(con)
    , remove: remove(con)
    , load: load(con)
    }
  }
}

function push(con){
  return (ripple) => {
    return (res, key, value) => {
      var p = promise(), table = header('table')(res)
      if (!table) return

      // console.log('push', table, res, key, value)
    }
  }
}

function update(con){
  return (ripple) => {
    return (res, key, value) => {
      var p = promise(), table = header('table')(res)
      if (!table) return

      // console.log('update', table, res, key, value)
    }
  }
}

function remove(con){
  return (ripple) => {
    return (res, key, value) => {
      var p = promise(), table = header('table')(res)
      if (!table) return

      // console.log('remove', table, res, key, value)
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

        con.query(`SELECT * FROM  ${table}`, function(e, rows) {
          if (e) return err(table, e)
          log('got', table, rows.length)
          ripple({ name: res.name, body: rows })
        })

      })

    }
  }
}

import promise from 'utilise/promise'
import header from 'utilise/header'
import client from 'utilise/client'
import key from 'utilise/key'
import log from 'utilise/log'
import err from 'utilise/err'
log = log('[ri/mysql]')
err = err('[ri/mysql]')
