var BackboneObserve = require("./src/backbone-observe.js");

var om = new BackboneObserve.model({id: 'id', foo: 1, bar: 2, baz: 3});
om.on("change:foo", function(model, val) {
    if (val == 2){
        console.log("It's work!!");
    }
});
om.set({'foo': 2});