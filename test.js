!(require('utilise/client')) && !function(){

var expect = require('chai').expect
  , mysql = require('./').default
  , core = require('rijs.core').default
  , data = require('rijs.data').default
  , db = require('rijs.db').default
  , mockery = require('mockery')
  , sql, next

describe('MySQL', function(){

  before(function(){ 
    mockery.enable()
    mockery.registerMock('mysql', { 
      createPool: function(){ 
        return { 
          escape: function(d){ return "'" + d + "'" }
        , query: function(d, fn){ next = fn; console.log('sql', sql = d) }
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
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
    expect(ripple.connections.length).to.be.eql(1)
    expect(ripple.connections[0].push).to.be.a('function')
    expect(ripple.connections[0].update).to.be.a('function')
    expect(ripple.connections[0].remove).to.be.a('function')
    expect(ripple.connections[0].load).to.be.a('function')
  })

  it('should create correct load SQL and behaviour', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
    ripple('foo', [1,2,3])
    expect(sql).to.be.eql('SHOW COLUMNS FROM foo')
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    expect(ripple.resources.foo.headers.table).to.be.eql('foo')
    expect(sql).to.be.eql('SELECT * FROM foo')
    next(null, [1,2,3,4])
    expect(ripple('foo')).to.be.eql([1,2,3,4])
  })

  it('should create correct insert SQL and behaviour', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (`name`) VALUES ('foo');")
    next(null, { insertId: 7 })
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should create correct update SQL and behaviour', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { id: 7 }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [record])
    ripple('foo')[0].name = 'foo'
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'update' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("UPDATE foo SET `name`='foo' WHERE id = 7;")
    next(null, {})
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should create correct remove SQL and behaviour', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { id: 7 }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [record])
    ripple('foo').pop()
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'remove' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("DELETE FROM foo WHERE id = 7;")
    next(null, {})
    expect(ripple('foo')).to.eql([])
  })

  it('should skip if resource not linked to table', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next({ code: 'ER_NO_SUCH_TABLE' })
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
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (`name`) VALUES ('foo');")
    next(null, { insertId: 7 })
    expect(ripple('foo')).to.eql([ { name: 'foo', id: 7 } ])
  })

  it('should not do anything with non-objects', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = 'foo'

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [])
    sql = ''
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql('')
    expect(ripple('foo')).to.eql(['foo'])
  })

  it('should deal with mysql errors (crud)', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [])
    ripple('foo').push(record)
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'push' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("INSERT INTO foo (`name`) VALUES ('foo');")
    next('err')
    expect(ripple('foo')).to.eql([ { name: 'foo' } ])
  })

  it('should deal with mysql errors (show table)', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next('err')
    expect(ripple('foo')).to.eql([])
  })

  it('should deal with mysql errors (select table)', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { name: 'foo' }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next('err', [])
    expect(ripple('foo')).to.eql([])
  })

  it('should skip props if not in db', function(){  
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
      , record = { id: 7 }

    ripple('foo', [])
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    next(null, [record])
    ripple('foo')[0].name = 'foo'
    ripple('foo')[0].baz = 'baz'
    var res = ripple.resources.foo
      , change = { key: 0, value: record, type: 'update' }
    ripple.emit("change", [res, change])
    expect(sql).to.eql("UPDATE foo SET `name`='foo' WHERE id = 7;")
    next(null, {})
    expect(ripple('foo')).to.eql([ { name: 'foo', baz: 'baz', id: 7 } ])
  })

  it('should strip mysql headers before sending', function(){ 
    var ripple = db(mysql(data(core())), { db: 'mysql://user:password@host:port/database' })
    ripple('foo', [1,2,3])
    expect(sql).to.be.eql('SHOW COLUMNS FROM foo')
    next(null, [{ Field: 'name' }, { Field: 'id' }])
    expect(ripple.resources.foo.headers.table).to.be.eql('foo')
    expect(ripple.resources.foo.headers.fields).to.be.eql(['name', 'id'])
    expect(sql).to.be.eql('SELECT * FROM foo')
    next(null, [1,2,3,4])
    expect(ripple('foo')).to.be.eql([1,2,3,4])

    expect('fields' in ripple.resources.foo.headers).to.be.ok
    expect('table' in ripple.resources.foo.headers).to.be.ok

    var headers = ripple.types['application/data'].to(ripple.resources.foo).headers
    expect('fields' in headers).to.not.be.ok
    expect('table' in headers).to.not.be.ok
  })

})

}()