!(require('utilise/client')) && !function(){

var expect = require('chai').expect
  , client = require('utilise/client')
  , resdir = require('./')
  , path = require('path')
  , core = require('rijs.core')
  , css = require('rijs.css')
  , fn = require('rijs.fn')
 
describe('Resources Folder', function(){

  it('should auto load resources folder', function(){  
    var ripple = resdir(fn(css(core())))
    expect(ripple('foo')).to.be.a('function')
    expect(ripple('foo').name).to.eql('foo')
    expect(ripple('bar.css')).to.equal('.bar {}')
  })

  it('should auto load from specific dir', function(){  
    var ripple = resdir(fn(css(core())), path.resolve())
    expect(ripple('foo')).to.be.a('function')
    expect(ripple('foo').name).to.eql('foo')
    expect(ripple('bar.css')).to.equal('.bar {}')
  })

})

}()