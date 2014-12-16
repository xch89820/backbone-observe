(function() {

    // Copy from Backbone.model's test
    var proxy = Backbone.Observe.model.extend();
    var klass = Backbone.Collection.extend({
        url: function () {
            return '/collection';
        }
    });
    var doc, collection;

    module("Backbone.Observe.model", {
        setup: function () {
            doc = new proxy({
                id: '1-the-tempest',
                title: "The Tempest",
                author: "Bill Shakespeare",
                length: 123
            });
            collection = new klass();
            collection.add(doc);
        }
    });

    var _start = start;
    var _stop = stop;
    if (!Backbone.Observe.model.prototype.supportOO || Backbone.Observe.model.prototype.ooVersion.ow === true){
        start = function(){};
        stop = function(){};
    }

    test("initialize", 3, function() {
        var Model = Backbone.Observe.model.extend({
            initialize: function() {
                this.one = 1;
                Backbone.Observe.model.prototype.initialize.apply(this, arguments);
                equal(this.collection, collection);
            }
        });
        var model = new Model({}, {collection: collection});
        equal(model.one, 1);
        equal(model.collection, collection);
    });

    test("initialize with attributes and options", 1, function() {
        var Model = Backbone.Observe.model.extend({
            initialize: function(attributes, options) {
                this.one = options.one;
                Backbone.Observe.model.prototype.initialize.apply(this, arguments);
            }
        });
        var model = new Model({}, {one: 1});
        equal(model.one, 1);
    });

    test("initialize with parsed attributes", 1, function() {
        var Model = Backbone.Observe.model.extend({
            parse: function(attrs) {
                attrs.value += 1;
                return attrs;
            }
        });
        var model = new Model({value: 1}, {parse: true});
        equal(model.get('value'), 2);
    });

    test("initialize with defaults", 2, function() {
        var Model = Backbone.Observe.model.extend({
            defaults: {
                first_name: 'Unknown',
                last_name: 'Unknown'
            }
        });
        var model = new Model({'first_name': 'John'});
        equal(model.get('first_name'), 'John');
        equal(model.get('last_name'), 'Unknown');
    });

    test("parse can return null", 1, function() {
        var Model = Backbone.Observe.model.extend({
            parse: function(attrs) {
                attrs.value += 1;
                return null;
            }
        });
        var model = new Model({value: 1}, {parse: true});
        equal(JSON.stringify(model.toJSON()), "{}");
    });

    test("url", 3, function() {
        doc.urlRoot = null;
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection.url = '/collection/';
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection = null;
        raises(function() { doc.url(); });
        doc.collection = collection;
    });

    test("url when using urlRoot, and uri encoding", 2, function() {
        var Model = Backbone.Observe.model.extend({
            urlRoot: '/collection'
        });
        var model = new Model();
        equal(model.url(), '/collection');
        model.set({id: '+1+'});
        equal(model.url(), '/collection/%2B1%2B');
    });

    test("url when using urlRoot as a function to determine urlRoot at runtime", 2, function() {
        var Model = Backbone.Observe.model.extend({
            urlRoot: function() {
                return '/nested/' + this.get('parent_id') + '/collection';
            }
        });

        var model = new Model({parent_id: 1});
        equal(model.url(), '/nested/1/collection');
        model.set({id: 2});
        equal(model.url(), '/nested/1/collection/2');
    });

    test("underscore methods", 5, function() {
        var model = new Backbone.Observe.model({ 'foo': 'a', 'bar': 'b', 'baz': 'c' });
        var model2 = model.clone();
        deepEqual(model.keys(), ['foo', 'bar', 'baz']);
        deepEqual(model.values(), ['a', 'b', 'c']);
        deepEqual(model.invert(), { 'a': 'foo', 'b': 'bar', 'c': 'baz' });
        deepEqual(model.pick('foo', 'baz'), {'foo': 'a', 'baz': 'c'});
        deepEqual(model.omit('foo', 'bar'), {'baz': 'c'});
    });

    test("chain", function() {
        var model = new Backbone.Observe.model({ a: 0, b: 1, c: 2 });
        deepEqual(model.chain().pick("a", "b", "c").values().compact().value(), [1, 2]);
    });

    test("clone", 10, function() {
        var a = new Backbone.Observe.model({ 'foo': 1, 'bar': 2, 'baz': 3});
        var b = a.clone();
        equal(a.get('foo'), 1);
        equal(a.get('bar'), 2);
        equal(a.get('baz'), 3);
        equal(b.get('foo'), a.get('foo'), "Foo should be the same on the clone.");
        equal(b.get('bar'), a.get('bar'), "Bar should be the same on the clone.");
        equal(b.get('baz'), a.get('baz'), "Baz should be the same on the clone.");
        a.set({foo : 100});
        equal(a.get('foo'), 100);
        equal(b.get('foo'), 1, "Changing a parent attribute does not change the clone.");

        var foo = new Backbone.Observe.model({p: 1});
        var bar = new Backbone.Observe.model({p: 2});
        bar.set(foo.clone().attributes, {unset: true});
        equal(foo.get('p'), 1);
        equal(bar.get('p'), undefined);
    });

    test("isNew", 6, function() {
        var a = new Backbone.Observe.model({ 'foo': 1, 'bar': 2, 'baz': 3});
        ok(a.isNew(), "it should be new");
        a = new Backbone.Observe.model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 });
        ok(!a.isNew(), "any defined ID is legal, negative or positive");
        a = new Backbone.Observe.model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 });
        ok(!a.isNew(), "any defined ID is legal, including zero");
        ok( new Backbone.Observe.model({          }).isNew(), "is true when there is no id");
        ok(!new Backbone.Observe.model({ 'id': 2  }).isNew(), "is false for a positive integer");
        ok(!new Backbone.Observe.model({ 'id': -5 }).isNew(), "is false for a negative integer");
    });

    test("get", 2, function() {
        equal(doc.get('title'), 'The Tempest');
        equal(doc.get('author'), 'Bill Shakespeare');
    });

    test("escape", 5, function() {
        equal(doc.escape('title'), 'The Tempest');
        doc.set({audience: 'Bill & Bob'});
        equal(doc.escape('audience'), 'Bill &amp; Bob');
        doc.set({audience: 'Tim > Joan'});
        equal(doc.escape('audience'), 'Tim &gt; Joan');
        doc.set({audience: 10101});
        equal(doc.escape('audience'), '10101');
        doc.unset('audience');
        equal(doc.escape('audience'), '');
    });

    test("has", 10, function() {
        var model = new Backbone.Observe.model();

        strictEqual(model.has('name'), false);

        model.set({
            '0': 0,
            '1': 1,
            'true': true,
            'false': false,
            'empty': '',
            'name': 'name',
            'null': null,
            'undefined': undefined
        });

        strictEqual(model.has('0'), true);
        strictEqual(model.has('1'), true);
        strictEqual(model.has('true'), true);
        strictEqual(model.has('false'), true);
        strictEqual(model.has('empty'), true);
        strictEqual(model.has('name'), true);

        model.unset('name');

        strictEqual(model.has('name'), false);
        strictEqual(model.has('null'), false);
        strictEqual(model.has('undefined'), false);
    });

    test("set", function() {
        var a = new Backbone.Observe.model({id: 'id', foo: 1, bar: 2, baz: 3});
        var changeCount = 0;

        a.on("change:foo", function() { changeCount += 1;});
        a.on("change:foo", function(model, val) {
            start();
            equal(val, 2, "Foo should have changed.");
            equal(changeCount, 1, "Change count should have incremented.");
            a.off("change:foo");
        });
        a.set({'foo': 2});
        stop();
    });

    test("unset", function() {
        var a = new Backbone.Observe.model({id: 'id', foo: 1, bar: 2, baz: 3});
        a.validate = function(attrs) {
            equal(attrs.baz, void 0, "validate:true passed while unsetting");
        };
        a.on("change", function(model, val) {
            start();
            equal(a.foo, undefined, "Unsetting the foo should remove the id property.");
            a.off("change");
        });
        a.unset('foo');
        a.unset('baz', {validate: true});
        stop();
    });

    test("nested set triggers with the correct options", function() {
        var model = new Backbone.Observe.model();
        var o1 = {};
        var o2 = {};
        var o3 = {};
        stop();
        model.on('change', function(__, options) {
            start();
            switch (model.get('a')) {
                case 1:
                    equal(options, o1);
                    stop();
                    return model.set('a', 2, o2);
                case 2:
                    equal(options, o2);
                    stop();
                    return model.set('a', 3, o3);
                case 3:
                    equal(options, o3);
            }
        });
        model.set('a', 1, o1);
    });


    test("#2030 - set with failed validate, followed by another set triggers change", function () {
        var attr = 0, main = 0, error = 0;
        var Model = Backbone.Observe.model.extend({
            validate: function (attr) {
                if (attr.x > 1) {
                    error++;
                    return "this is an error";
                }
            }
        });
        var model = new Model({x:0});
        model.on('change:x', function () {
            attr++;
        });
        model.on('change', function () {
            main++;
            start();
            deepEqual([attr, main, error], [1, 1, 1]);
        });
        stop();
        model.set({x:2}, {validate:true});
        model.set({x:1}, {validate:true});

    });

    test("set triggers changes in the correct order", function() {
        var value = null;
        var model = new Backbone.Observe.model;
        model.on('last', function(){ value = 'last'; });
        model.on('first', function(){ value = 'first'; });
        model.trigger('first');
        model.trigger('last');
        equal(value, 'last');
    });

    test("set falsy values in the correct order", 2, function() {
        var model = new Backbone.Observe.model({result: 'result'});
        model.on('change', function() {
            start();
            equal(model.changed.result, void 0);
            equal(model.previous('result'), false);
        });
        model.set({result: void 0}, {silent: true});
        model.set({result: null}, {silent: true});
        model.set({result: false}, {silent: true});
        model.set({result: void 0});
        stop();
    });

    test("nested set triggers with the correct options", function() {
        var model = new Backbone.Observe.model();
        var o1 = {};
        var o2 = {};
        var o3 = {};
        model.on('change', function(__, options) {
            start();
            switch (model.get('a')) {
                case 1:
                    equal(options, o1);
                    stop();
                    return model.set('a', 2, o2);
                case 2:
                    equal(options, o2);
                    stop();
                    return model.set('a', 3, o3);
                case 3:
                    equal(options, o3);
            }
        });
        model.set('a', 1, o1);
        stop();
    });

    test("unset and changedAttributes", 1, function() {
        var model = new Backbone.Observe.model({a: 1});
        model.on('change', function() {
            start();
            ok('a' in model.changedAttributes(), 'changedAttributes should contain unset properties');
        });
        model.unset('a');
        stop();
    });

    test("using a non-default id attribute.", 5, function() {
        var MongoModel = Backbone.Observe.model.extend({idAttribute : '_id'});
        var model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
        equal(model.get('id'), 'eye-dee');
        equal(model.id, 25);
        equal(model.isNew(), false);
        model.on("change:_id", function(){
            start();
            equal(model.id, undefined);
            equal(model.isNew(), true);
        });
        model.unset('_id');
        stop();
    });

    test("set an empty string", 1, function() {
        var model = new Backbone.Observe.model({name : "Model"});
        model.on("change:name", function(){
            start();
            equal(model.get('name'), '');
        });
        model.set({name : ''});
        stop();
    });

    test("setting an object", 1, function() {
        var model = new Backbone.Observe.model({
            custom: { foo: 1 }
        });
        model.on('change', function() {
            start();
            ok(1);
        });
        model.set({
            custom: { foo: 1 } // no change should be fired
        });
        model.set({
            custom: { foo: 2 } // change event should be fired
        });
        stop();
    });

    test("clear", 3, function() {
        var changed;
        var model = new Backbone.Observe.model({id: 1, name : "Model"});
        model.on("change:name", function(){ changed = true; });
        model.on("change", function() {
            start();
            var changedAttrs = model.changedAttributes();
            ok('name' in changedAttrs);
            equal(changed, true);
            equal(model.get('name'), undefined);
        });
        model.clear();
        stop();
    });

    test("defaults", 4, function() {
        var Defaulted = Backbone.Observe.model.extend({
            defaults: {
                "one": 1,
                "two": 2
            }
        });
        var model = new Defaulted({two: undefined});
        equal(model.get('one'), 1);
        equal(model.get('two'), 2);
        Defaulted = Backbone.Observe.model.extend({
            defaults: function() {
                return {
                    "one": 3,
                    "two": 4
                };
            }
        });
        model = new Defaulted({two: undefined});
        equal(model.get('one'), 3);
        equal(model.get('two'), 4);
    });

    test("change, hasChanged, changedAttributes, previous, previousAttributes", 9, function() {
        var model = new Backbone.Observe.model({name: "Tim", age: 10});
        deepEqual(model.changedAttributes(), false);
        model.on('change:name', function() {
            start();
            equal(model.get('name'), 'Rob');
        });
        model.on('change', function() {
            ok(model.hasChanged('name'), 'name changed');
            ok(!model.hasChanged('age'), 'age did not');
            ok(_.isEqual(model.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
            equal(model.previous('name'), 'Tim');
            ok(_.isEqual(model.previousAttributes(), {name : "Tim", age : 10}), 'previousAttributes is correct');
        });
        equal(model.hasChanged(), false);
        equal(model.hasChanged(undefined), false);
        model.set({name : 'Rob'});
        stop();

    });

    test("changedAttributes", 3, function() {
        var model = new Backbone.Observe.model({a: 'a', b: 'b'});
        deepEqual(model.changedAttributes(), false);
        equal(model.changedAttributes({a: 'a'}), false);
        equal(model.changedAttributes({a: 'b'}).a, 'b');
    });

    test("change with options", 1, function() {
        var value;
        var model = new Backbone.Observe.model({name: 'Rob'});
        model.on('change:name', function(model, val, options) {
            value = options.prefix + model.get('name');
        });
        model.on('change', function(){
            start();
            equal(value, 'Mr. Bob');
        });
        model.set({name: 'Bob'}, {prefix: 'Mr. '});
        stop();
    });

    test("change after initialize", 1, function () {
        var changed = 0;
        var attrs = {id: 1, label: 'c'};
        var obj = new Backbone.Observe.model(attrs);
        obj.on('change', function() {
            changed += 1;
        });
        obj.set(attrs);
        _stop();
        // Any good idea to test it??
        setTimeout(function(){
            _start();
            equal(changed, 0);
        }, 1000);
    });

    test("save within change event", 1, function () {
        var env = this;
        var model = new Backbone.Observe.model({firstName : "Taylor", lastName: "Swift"});
        model.url = '/test';
        model.on('change', function () {
            start();
            model.save();
            ok(_.isEqual(env.syncArgs.model, model));
        });
        model.set({lastName: 'Hicks'});
        stop();
    });

    test("validate after save", 2, function () {
        var lastError, model = new Backbone.Observe.model();
        model.validate = function (attrs) {
            if (attrs.admin) return "Can't change admin status.";
        };
        model.sync = function (method, model, options) {
            options.success.call(this, {admin: true});
        };
        model.on('invalid', function (model, error) {
            lastError = error;
        });
        model.save(null);

        equal(lastError, "Can't change admin status.");
        equal(model.validationError, "Can't change admin status.");
     });

    test("save", 2, function () {
        doc.save({title: "Henry V"});
        equal(this.syncArgs.method, 'update');
        ok(_.isEqual(this.syncArgs.model, doc));
    });

    test("save, fetch, destroy triggers error event when an error occurs", 3, function () {
        var model = new Backbone.Observe.model();
        model.on('error', function () {
            ok(true);
        });
        model.sync = function (method, model, options) {
            options.error();
        };
        model.save({data: 2, id: 1});
        model.fetch();
        model.destroy();
    });

    test("save with PATCH", function () {
        doc.clear().set({id: 1, a: 1, b: 2, c: 3, d: 4});
        doc.save();
        equal(this.syncArgs.method, 'update');
        equal(this.syncArgs.options.attrs, undefined);

        doc.save({b: 2, d: 4}, {patch: true});
        equal(this.syncArgs.method, 'patch');
        equal(_.size(this.syncArgs.options.attrs), 2);
        equal(this.syncArgs.options.attrs.d, 4);
        equal(this.syncArgs.options.attrs.a, undefined);
        equal(this.ajaxSettings.data, "{\"b\":2,\"d\":4}");
    });

    test("save with PATCH and different attrs", function () {
        doc.clear().save({b: 2, d: 4}, {patch: true, attrs: {B: 1, D: 3}});
        equal(this.syncArgs.options.attrs.D, 3);
        equal(this.syncArgs.options.attrs.d, undefined);
        equal(this.ajaxSettings.data, "{\"B\":1,\"D\":3}");
        deepEqual(doc.attributes, {b: 2, d: 4});
    });

    test("save in positional style", 1, function () {
        var model = new Backbone.Observe.model();
        model.sync = function (method, model, options) {
            options.success();
        };
        model.save('title', 'Twelfth Night');
        equal(model.get('title'), 'Twelfth Night');
    });

    test("save with non-object success response", 2, function () {
        var model = new Backbone.Observe.model();
        model.sync = function (method, model, options) {
            options.success('', options);
            options.success(null, options);
        };
        model.save({testing: 'empty'}, {
            success: function (model) {
                deepEqual(model.attributes, {testing: 'empty'});
            }
        });
    });

    test("fetch", 2, function () {
        doc.fetch();
        equal(this.syncArgs.method, 'read');
        ok(_.isEqual(this.syncArgs.model, doc));
    });

    test("destroy", 3, function () {
        doc.destroy();
        equal(this.syncArgs.method, 'delete');
        ok(_.isEqual(this.syncArgs.model, doc));

        var newModel = new Backbone.Observe.model;
        equal(newModel.destroy(), false);
    });

    test("non-persisted destroy", 1, function () {
        var a = new Backbone.Observe.model({'foo': 1, 'bar': 2, 'baz': 3});
        a.sync = function () {
            throw "should not be called";
        };
        a.destroy();
        ok(true, "non-persisted model should not call sync");
    });

    test("validate", function () {
        var lastError;
        var model = new Backbone.Observe.model({
            default:{
                admin:true
            }
        });
        model.validate = function (attrs) {
            if (attrs.admin != this.get('admin')) return "Can't change admin status.";
        };
        model.on('invalid', function (model, error) {
            lastError = error;
        });
        model.on("change:a", function(){
            start();
            equal(model.get('a'), 100);
            equal(lastError, undefined);
            model.off("change:a");
            model.on("change", function(){
                start();
                equal(lastError, "Can't change admin status.");
                equal(model.get('a'), 100);
            });
            model.set({a: 200, admin: false}, {validate:true});
            stop();
        });
        model.set({a:100});
        stop();
    });

    /*test("validate on unset and clear", function() {
        var error;
        var model = new Backbone.Model({name: "One"});
        model.validate = function(attrs) {
            if (!attrs.name) {
                error = true;
                return "No thanks.";
            }
        };
        model.on("change:name", function(){
            start();
            equal(model.get('name'), 'Two');
            equal(error, undefined);
            model.on("invalid", function(){
                equal(error, true);
                equal(model.get('name'), 'Two');
                model.off("change:name");
                model.on("change", function(){
                    start();
                    equal(model.get('name'), undefined);
                });
                delete model.validate;
                model.clear();
                stop();
            });
            model.unset('name', {validate: true});
        });
        model.set({name: "Two"});
        stop();
    });

    test("validate with error callback", function() {
        var lastError, boundError;
        var model = new Backbone.Model();
        model.validate = function(attrs) {
            if (attrs.admin) return "Can't change admin status.";
        };
        model.on('invalid', function(model, error) {
            boundError = true;
        });
        model.on("change:a", function(){
            start();
            equal(model.get('a'), 100);
            equal(model.validationError, null);
            equal(boundError, undefined);
            model.off("change:a");
            model.on("change", function(){
                start();
                equal(model.get('a'), 100);
                equal(model.validationError, "Can't change admin status.");
                equal(boundError, true);
            });
            model.set({a: 200, admin: true}, {validate:true});
            stop();
        });
        model.set({a: 100}, {validate:true});
        stop();
    });*/

})();