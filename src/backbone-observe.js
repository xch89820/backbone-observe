// Backbone Observe 1.0.0

(function(root, factory) {
    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore'], function(Backbone) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            if (!Backbone.Observe){
                Backbone.Observe = {
                    model: factory(root, Backbone, _)
                };
            }
        });
        // Next for Node.js or CommonJS
    } else if (typeof exports !== 'undefined') {
        var Backbone = require('backbone'),
            _ = require('underscore');
        exports.model = factory(root, Backbone, _);
    } else if (!root.Backbone.Observe){
        root.Backbone.Observe = {
            model: factory(root, root.Backbone, root._)
        };
    }

}(this, function(root, Backbone, _) {
    // Detect Object.observe
    // If not support OO, we will detect of Object.prototype.watch(OW)[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch] exists
    // If not support OW, we will try to require observed library if exist in Node.js
    var OO = Object.observe,
        OW = {}.watch;
    var isSupportOO = !!OO, isSupportOW = !!OW;

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
        supportOO: isSupportOO || isSupportOW,
        ooVersion:{
            oo:isSupportOO,
            ow:isSupportOW
        },
        // Overwrite the initialize
        initialize: function(){
            // We watch on the attributes in initialize
            var me = this;
            if (isSupportOO){
                OO(this.attributes, function(){
                    // To fixed this point
                    me.observe.apply(me, arguments);
                });
                this.watched = true;
            }else if (isSupportOW){
                // Only set the flag to true
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
        _watchHandler: function(name, oldval, newval, options, type){
            this.observe.call(this, [
                {
                    name: name,
                    type: type || "change",
                    oldValue: oldval,
                    object: {
                        name: newval
                    }
                }]
            );
            return newval;
        },
        // Overwrite the set function
        // The observe function will be invoke ONLY some changing has happened, so we should determine whether they are equal.
        set: function(key, val, options) {
            if (!this.watched || (!isSupportOO && !isSupportOW) ){
                // If not support OO, run the Backbone.Model.set
                return Backbone.Model.prototype.set.apply(this, arguments);
            }

            var attr, attrs, unset, current, chinging, me = this;
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

                // If the value is equaled to current value, observe function will not be triggered.
                if (_.isEqual(current[attr], val)) {
                    // Compare with previous value
                    //this._setChanged(attr, val);
                    continue;
                }
                // Push the options to queue to save current status
                this.ooFIFOQueue.push({
                    previousAttributes: this._previousAttributes,
                    options: options,
                    snapshot: val
                });
                // Add watch handler if browser support object.prototype.watch
                if (isSupportOW && !unset){
                    this.attributes.watch(attr ,function(){
                        return me._watchHandler.apply(me, arguments);
                    });
                }

                unset ? delete current[attr] : current[attr] = val;

                // For support Object.prototype.watch
                if (isSupportOW){
                    // Object.prototype.watch not deal with "delete", so we should invoke it by our self
                    if (unset){
                        me._watchHandler.call(me, attr, val, undefined, options, "delete");
                    }
                    if (!options.silent){
                        this.trigger('change:' + attr, this, val, options);
                    }
                }
            }

            //Finished changed
            this._changing = false;
            // Object.prototype.watch like a callback when the attribute changing, so we should call the change in here.
            if (isSupportOW && !options.silent){
                while (this._pending) {
                    options = this._pending;
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }
            return this;
        },
        // Deal with the change of attributes
        observe: function(changes){
            var args, options, prev, silent, changing, change, name, type, old, val;

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
                this._pending = options;

                // Compare with previous value
                this._setChanged(name, val, prev);

                if (!isSupportOW && (type !== 'delete' || !_.isUndefined(old))) {
                    if (!silent) {
                        this.trigger('change:' + name, this, val, options);
                    }
                }else if (isSupportOW){
                    // Unwatch the property
                    this.attributes.unwatch(name);
                }

            }

            // You might be wondering why there's a `while` loop here. Changes can
            // be recursively nested within `"change"` events.
            // Firefox's 'watch' like a callback when the attribute changing.
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
    BooModel.version = "1.0.0";

    return BooModel;
}));