!(require('utilise/client')) && !function(){

var expect = require('chai').expect
  , mysql = require('./')
  , core = require('rijs.core')
  , data = require('rijs.data')
  , db = require('rijs.db')
  , mockery = require('mockery')
  , identity = require('utilise/identity')
  , sql, fn

describe('MySQL', function(){

  before(function(){ 
    mockery.enable()
    mockery.registerMock('mysql', { 
      createPool: function(){ 
        return { 
          escape: identity
        , query: function(a, b){ fn = b; console.log('sql', sql = a) }
        }
      }
    })
  })

  beforeEach(function(){
    sql = ''
  })

  after(function(){ 
    mockery.disable()
  })

  it('should create connection hooks', function(){  
    var ripple = mysql(db(data(core())))
    ripple.db('mysql://user:password@host:port/database')
    expect(ripple.db.connections.length).to.be.eql(1)
    expect(ripple.db.connections[0].push).to.be.a('function')
    expect(ripple.db.connections[0].update).to.be.a('function')
    expect(ripple.db.connections[0].remove).to.be.a('function')
    expect(ripple.db.connections[0].load).to.be.a('function')
  })

  it('should create correct load SQL and behaviour', function(){  
    var ripple = mysql(db(data(core())))
    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [1,2,3])
    expect(sql).to.be.eql('SHOW TABLES LIKE "foo"')
    fn(null, ['foo'])
    expect(ripple.resources.foo.headers.table).to.be.eql('foo')
    expect(sql).to.be.eql('SELECT * FROM foo')
    fn(null, [1,2,3,4])
    expect(ripple('foo')).to.be.eql([1,2,3,4])
  })

  it('should create correct insert SQL and behaviour', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (name) VALUES (foo);")
    fn(null, { insertId: 7 })
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should create correct update SQL and behaviour', function(){  
    var ripple = mysql(db(data(core())))
      , record = { id: 7 }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [record])
    ripple('foo')[0].name = 'foo'
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'update' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("UPDATE foo SET name=foo WHERE id = 7;")
    fn(null, {})
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should create correct remove SQL and behaviour', function(){  
    var ripple = mysql(db(data(core())))
      , record = { id: 7 }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [record])
    ripple('foo').pop()
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'remove' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("DELETE FROM foo WHERE id = 7;")
    fn(null, {})
    expect(ripple('foo')).to.eql([])
  })

  it('should skip if resource not linked to table', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, [])
    expect(ripple.resources.foo.headers.table === '').to.be.ok
    sql = ''

    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("")
    expect(ripple('foo')).to.eql([ { name: 'foo' } ])
  })

  it('should create correct insert SQL and behaviour', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (name) VALUES ('foo');")
    fn(null, { insertId: 7 })
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should not do anything with non-objects', function(){  
    var ripple = mysql(db(data(core())))
      , record = 'foo'

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [])
    sql = ''
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql('')
    expect(ripple('foo')).to.eql(['foo'])
  })

  it('should deal with mysql errors (crud)', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (name) VALUES ('foo');")
    fn('err')
    expect(ripple('foo')).to.eql([ { name: 'foo' } ])
  })

  it('should deal with mysql errors (show table)', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn('err')
    expect(ripple('foo')).to.eql([])
  })

  it('should deal with mysql errors (select table)', function(){  
    var ripple = mysql(db(data(core())))
      , record = { name: 'foo' }

    ripple.db('mysql://user:password@host:port/database')
    ripple('foo', [])
    fn(null, ['foo'])
    fn('err', [])
    expect(ripple('foo')).to.eql([])
  })

})

}()