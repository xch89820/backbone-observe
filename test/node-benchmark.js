var Benchmark = require('benchmark');
global.Backbone = require("backbone");
global.BackboneObserve = require("backbone.observe");

var suite = new Benchmark.Suite;
suite.add('Backbone.set#test', function() {
    backboneModel.on("change:foo", function(){
        this.get("foo");
    });
    backboneModel.set({"foo": 2});
},{
    setup: function(){
        var backboneModel = new Backbone.Model();
    }
})
.add('Backbone.observe.set#test', function() {
    backboneOberveModel.on("change:foo", function(){
        this.get("foo");
    });
    backboneOberveModel.set({"foo": 2});
},{
    setup: function(){
        var backboneOberveModel = new BackboneObserve.model();
    }
})
.on('error', function(event){
    console.log(event.target.error);
})
.on('cycle', function(event) {
      console.log(String(event.target));
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
.run({ 'async': true  });

