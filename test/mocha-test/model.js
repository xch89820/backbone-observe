var BackboneObserve = require("../../src/backbone-observe.js");
var should = require('should');

describe('base', function(){
    describe('#change()', function(){
        it('change one attribute', function(done){
            var om = new BackboneObserve.model({id: 'id', foo: 1, bar: 2, baz: 3});
            om.on("change:foo", function(model, val) {
                val.should.equal(2);
                done();
            });
            om.set({'foo': 2});
        })
    })
});
