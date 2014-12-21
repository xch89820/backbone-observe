(function(){
    var $testResult = $("#test-result"),
        $errorResult = $("#error-result"),
        $progressbar = $(".progress-bar");

    if (!Backbone.Observe.model.prototype.supportOO){
        $("#not-support").show();
    }
    
    var basicSuite = new Benchmark.Suite,
        finished = 0;
    basicSuite.add('Backbone.set#test', function() {
        backboneModel.on("change:foo", function(){
            if (this.get("foo") !== 2){
                throw("Backbone.set: One set failed!!");
            }
        });
        backboneModel.set({"foo": 2});
    },{
        setup: function(){
            var backboneModel = new Backbone.Model();
        }
    }).add('Backbone.observe.set#test', function () {
        backboneOberveModel.on("change:foo", function(){
            if (this.get("foo") !== 2){
                throw("Backbone.observe.set: One set failed!!");
            }
        });
        backboneOberveModel.set({"foo": 2});
    },{
        setup: function () {
            var backboneOberveModel = new Backbone.Observe.model();
        }
    }).add('Backbone.unset#test', function () {
        backboneModel.on("change:foo", function () {
            if (typeof this.get("foo") !== "undefined") {
                throw("Backbone.set: Unset failed!!");
            }
        });
        backboneModel.unset("foo");
    }, {
        setup: function () {
            var backboneModel = new Backbone.Model({"foo": 2});
        }
    }).add('Backbone.observe.set#test', function () {
        backboneOberveModel.on("change:foo", function () {
            if (typeof this.get("foo") !== "undefined") {
                throw("Backbone.observe.set: Unset failed!!");
            }
        });
        backboneOberveModel.unset("foo");
    }, {
        setup: function () {
            var backboneOberveModel = new Backbone.Observe.model({"foo": 2});
        }
    }).on('error', function (event) {
        $errorResult.show().text("Error: " + event.target.error);
    }).on('cycle', function(event) {
        $testResult.append($("<p>" + String(event.target) + "</p>"));
        
        finished++;
        var progress = Math.floor(finished/basicSuite.length*100);
        $progressbar.attr("aria-valuenow", progress).css("width",progress+"%").find("span:first").text(progress+"% Complete");
        
    }).on('complete', function () {
        var basicFast = Benchmark.filter(this.slice(0,2),"fastest")[0].name;
        $testResult.append($("<p>Fastest is <strong>" + basicFast + "</strong></p>"));

        var unsetFast = Benchmark.filter(this.slice(2,4),"fastest")[0].name;
        $testResult.append($("<p>Fastest is <strong>" + unsetFast + "</strong></p>"));
    }).run({'async': true});

})();
