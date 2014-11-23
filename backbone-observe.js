// Backbone Observe 1.0.0

(function(root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['backbone'], function(Backbone) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            root.Backbone.ObserveModel = factory(root, Backbone);
        });
        // Next for Node.js or CommonJS
    } else if (typeof exports !== 'undefined') {
        var Backbone = require('backbone');
        factory(root, Backbone);
    } else {
        root.Backbone.ObserveModel = factory(root, root.Backbone);
    }

}(this, function(root, Backbone) {
    // Detect Object.observe
    // If not support OO, we will detect of Object.prototype.watch(OW)[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch] exists
    // If not support OW, we will try to require observed library if exist in Node.js
    var OO = Object.observe,
        OW = {}.watch;
    var isSupportOO = !!OO, isSupportOW = !!OW;
    if (!isSupportOO && !isSupportOW){
        //try to require library "observed"(https://github.com/aheckmann/observed)
        try{
            OO = require('observed');
        }catch(e){
            console.log("The environment not support Object.observe.");
        }
    }

    // BackboneObserve.Model
    // --------------
    var BooModel = Backbone.Model.extend({
        constructor: function(){
            // Because the OO is an async function.
            // When we modify the Object which we watched, we push the set option to this Queue.
            // After the OO callback, we call the 'shift' to and take the first option in Queue.
            this.ooFIFOQueue = [];
            this.watched = false;
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        initialize: function(){
            // We watch on the attributes in initialize
            var me = this;
            if (isSupportOO){
                OO(this.attributes, function(){
                    // To fixed this point
                    me.observe.apply(me, arguments);
                });
                this.watched = true;
            }
            Backbone.Model.prototype.initialize.apply(this, arguments);
        },
        _setChanged: function(name, val, previousAttributes){
            var prev = previousAttributes || this._previousAttributes;
            if (!_.isEqual(prev[name], val)) {
                this.changed[name] = val;
            } else {
                delete this.changed[name];
            }
        },
        _watchHandler: function(id, oldval, newval){
            this.observe.apply(this, [
                {
                    name: id,
                    type: "change",
                    oldValue: oldval,
                    object: this.attribute
                }]
            );
        },
        // Overwrite the set function
        // The OO's set ONLY change model's attribute and exit.
        // We add an useful parameter 'callback' in options if you want to listen observe return when you set a property.
        // The options.callback have four arguments: name(the attr's name), val(the new value), old(the old value), change(changed by observe offered), options
        set: function(key, val, options) {
            if (!this.watched || (!isSupportOO && !isSupportOW) ){
                //If not support OO, run the Backbone.Model.set
                return Backbone.Model.prototype.set.apply(this, arguments);
            }

            var attr, attrs, unset, current, callback, chinging, me = this;
            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options || (options = {});

            // Run validation.
            if (!this._validate(attrs, options)) return false;

            unset = options.unset;
            callback = options.callback;
            current = this.attributes;
            //Lock to change
            chinging = this._changing;
            this._changing  = true;

            if (!chinging){
                this._previousAttributes = _.clone(this.attributes);
            }

            // Check for changes of `id`.
            if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

            // Change the attribute immediately
            for (attr in attrs) {
                val = attrs[attr];

                // If it is a same value, oo will not be triggered.
                if (_.isEqual(current[attr], val)) {
                    // Compare with previous value
                    this._setChanged(attr, val);

                    if (callback){
                        callback.call(this, attr, val, null, null, options);
                    }
                    continue;
                }
                // Add watch handler if browser support object.prototype.watch
                if (isSupportOW){
                    this.attribute.watch(attr ,function(){
                        me._watchHandler.apply(me, arguments);
                    });
                }

                // Push the options to queue
                this.ooFIFOQueue.push({
                    previousAttributes: this._previousAttributes,
                    options: options,
                    snapshot: val
                });

                unset ? delete current[attr] : current[attr] = val;

            }

            //Finished changed
            this._changing = false;
            return this;
        },
        // Deal with the change of attributes
        observe: function(changes){
            var args, options, prev, changes, silent, changing, change, name, type, old, val, callback;

            changing        = this._changing;

            // Get options
            for (var i = 0, length = changes.length; i < length; i++) {
                change = changes[i];
                name = change.name;
                type = change.type;
                old = change.oldValue;

                // Gain options from FIFO queue
                args = this.ooFIFOQueue.shift();
                prev = args.previousAttributes;
                val = change.object[name] || args.snapshot;
                options = args.options || {};

                silent = options.silent;
                callback = options.callback;
                this._pending = options;

                // Compare with previous value
                this._setChanged(name, val, prev);

                if (type !== 'delete' || !_.isUndefined(old)) {
                    if (!silent) {
                        this.trigger('change:' + name, this, val, options);
                    }
                }else{
                    // Unwatch the property
                    if (isSupportOW){
                        this.attribute.unwatch(name);
                    }
                }
                // Call the options.callback
                if (callback){
                    callback.call(this, name, val, old, change, options);
                }
            }

            // You might be wondering why there's a `while` loop here. Changes can
            // be recursively nested within `"change"` events.
            if (changing) return this;
            if (!silent) {
                while (this._pending) {
                    options = this._pending;
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }
            this._pending = false;

            return this;
        }
    });

    return BooModel;

}));