# backbone-observe

------

A Backbone extend which make Backbone support Object.observe feature in browser and nodejs.

## What is Object.observe
Object.observe(), part of a future ECMAScript standard, is a method for asynchronously observing changes to JavaScript objects without the need for a separate library. It allows an observer to receive a time-ordered sequence of change records which describe the set of changes which took place to a set of observed objects.
The Object.observe is a new technology which's going to change everything you think you know about data-binding. It’s also going to change how many of your MVC libraries approach observing models for edits and updates.

You can get more information in this [article][1].

## How to install
### Node.js
Available in Node >= 0.11.13, the standards compliant Object.observe treasure resides.

    npm install backbone-observe -g

And then require the package in your code.

    var BackboneObserve = require("backbone-observe");
    var om = new BackboneObserve.model({id: 'id', foo: 1, bar: 2, baz: 3});

### AMD
    require.config({
        path :{
            backbone : "you/backbone/path",
            underscore : "you/underscore/path",
            "backbone-observe" : "you/backbone-observe/path"
            //...code...
        }
    });

    require(["backbone-observe"], function(BackboneObserve){
        var ooModel = BackboneObserve.model;
        //...code...
    });

### Browser
    <!-- Import backbone -->
    <script type="text/javascript" src="underscore.min.js"></script>
    <script type="text/javascript" src="backbone.min.js"></script>
    <!-- Import Backbone-Observe -->
    <script type="text/javascript" src="backbone-observe.js"></script>

    <script type="text/javascript">
        var ooModel = Backbone.Observe.model;
        //...code...
    </script>

## What's difference?
If you use **backbone-observe** to make up your application, every thing are same as the basal model of Backbone except the changing of value is an "asynchronous" processing and the events trigger are not in order to because the Object.observe. It means that you can not expect the value has changed after you invoke the `set` or `unset` function.
Here is an example:

    var a = new Backbone.Observe.model({id: 'id', foo: 1, bar: 2, baz: 3});
    a.on("change:foo", function(model, val) {
        console.log(a.get('foo')); //2
    });
    a.set({'foo': 2});
    console.log(a.get('foo')); //1

We print the value of `foo` after set the value immediately and the time that `change` event triggered. As you see, the value not changed after we set it but you can be caught up with the new value at the callback of `change` event.
The modify functiuon is totally an asynchronous operation via the Object.observe.

In fact, the attributes of model will be observed by your browser and invoke the callback function for a period of time.
Another example can help us to understand the mechanism of this action.

    var changed = 0;
    var obj = new Backbone.Observe.model();
    obj.on('change', function() {
        changed += 1;
        console.log("Trigger change!");
    });
    obj.set({id: 1, label: 'c'});
    setTimeout(function(){
        //output after the callback of change
        console.log(changed); //1
    }, 0);

As you see, the callback of change will be executed **before** the timeout callback. This example reveals that the `Object.observe` will deliver the modify event and insert it to the event queue as soon as possible and excute it on the nearest timer tick.

If you not understand the event queue and the non-block I/O, you can see the follow documents.
> * [Javascript event loop explained][2]
> * [Events and timing in-depth][3]

## Compatibility
* Now the Google Chrome browser (version greater than 36) and the Chrome for Android has supported the Object.observe. You can check the [MDN][4] for more information.
* The object.prototype.watch are supported by the Fiefox but not recommend to use.
* The Node.js has supported the Object.observe in 0.11.13 but not publish to the standard version yet.

## Benchmarkjs
You can run the benchmark test in [here][5].Please make sure to use the browser supported to Object.observe feature.
Benchmark test recommend to expose Java’s nanosecond timer or enable Chrome’s microsecond timer, please [read the documents of benchmarkjs][6] for more information.
The follow is one test result in our computer:

    Backbone.set#test x 76,170 ops/sec ±11.36% (79 runs sampled)
    Backbone.observe.set#test x 140,429 ops/sec ±2.66% (74 runs sampled)
    Backbone.unset#test x 74,966 ops/sec ±1.95% (80 runs sampled)
    Backbone.observe.set#test x 90,667 ops/sec ±2.77% (75 runs sampled)
    Fastest is Backbone.observe.set#test
    Fastest is Backbone.observe.set#test

You can run the `node-benchmark.js` in test directory if you want to run benchmark in node.js.

## Change Log
### v1.0.3
Add benchmarkjs test

### v1.0.2
Release the project

[1]: http://www.html5rocks.com/en/tutorials/es7/observe/?redirect_from_locale=zh
[2]: http://blog.carbonfive.com/2013/10/27/the-javascript-event-loop-explained
[3]: http://javascript.info/tutorial/events-and-timing-depth#javascript-is-single-threaded
[4]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
[5]: http://www.jonecasper.com/Backbone.Observe/test/benchmark.html
[6]: http://benchmarkjs.com/