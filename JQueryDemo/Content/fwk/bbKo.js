//     bbKo.js 0.1.0
//     (c) 2012 Dave Nicolas, AxiomSoft Inc.
//     bbko may be freely distributed under the MIT license.
//     For all details and documentation:
//     <Coming Soon>

window.bbko = {};
//Use to keep a reference to the controller between callbacks
var root;
//Use to store custom events
var eventStore = [];

/*
 *Automatically binds view granted that knockout framework is available
 *Otherwise, micro framework will skip this logic
 */
var bindView = function() {
        //Keep reference to view for context switching
        var view = this;
        if (!ko) return false;
        if (!this.scope) {
            alert('view scope is required in order to dynamically bind model');
            return false;
        }
        //Retrieve the model. Abort if there are none present
        var viewModel = getModel(this.scope);
        if (!viewModel) return false;

        //init the view scope on the window
        window[this.scope] = {};

        //Parse all dom elements with a databind element pertaining to the view scope
        $('[data-bind*="' + this.scope + '"]').each(function() {
            //Extract property name
            var attrValue = $(this).attr('data-bind');
            var prop = attrValue.substring(attrValue.lastIndexOf('.') + 1, attrValue.length);
            //Set observable property from model;then, attach to window
            window[view.scope][prop] = _.isArray(viewModel.get(prop)) ? ko.observable(viewModel.get(prop)) : ko.observableArray(viewModel.get(prop));
        });
        ko.applyBindings(window[this.scope]);
    };

var templateBind = function(opts) {
    
        var view = this;
        //Validate widget url
        if (!opts.url) {
            alert('Provide a url for the template widget');
            return false;
        }

        //Retrieve widget template
        $.get(opts.url, function(tpl) {
            debugger;
            if (!tpl) {
                alert('Invalid template path');
                return false;
            }

            //Get the ollection scope from the view
            var dataSource = getCollection(view.scope);
            var modelSource = getModel(view.scope);

            //Create View Engine context
            var context = {};

            if (dataSource) {

                context[view.scope] = [];

                //Parse backbone model collection and transform to simple js object
                _.each(dataSource.models, function(model, index, array) {
                    var ontheFly = {};
                    _.each(model.attributes, function(value, key) {
                        ontheFly[key] = value;
                    });
                    context[view.scope].push(ontheFly);
                });


            }else{
                //If collection is null, system is trying to bind a simple model
                //Parse backbone model and transform to pojo
              _.each(modelSource.attributes, function(value, key){
                 context[key] = value;
              });
            }

            //Invoke Mustache templating engine
            var html = Mustache.to_html($(tpl)[0].innerHTML, context);

            //Abort if a container is not provided
            if (!opts.containerId) {
                alert('Template contaier not defined');
                return false;
            }

            //Append result to template container
            $('#' + opts.containerId).append(html);

            if (opts.afterRender && typeof opts.afterRender == 'function')
                opts.afterRender();
        });
    };

//Creates a model instance and add it to the controller model collection
var createModel = function(config, data, isModelValid) {
        if (!root.models) root.models = [];
        var ontheFly = Backbone.Model.extend(config);
        var newModel = new ontheFly;
        root.models.push(newModel);
        if (isModelValid && typeof isModelValid == 'function') isModelValid.apply
        return root;
    };

//Creates a collection instance and add it to the controler collection store
var createCollection = function(opts) {
        if (!root.collections) root.collections = [];
        var ontheFly = Backbone.Collection.extend(opts);
        var newCollection = new ontheFly;
        root.collections.push(newCollection);
    };

//Gets a model by name
var getModel = function(modelId) {
        var model = _.find(root.models, function(model) {
            return model.modelId == modelId;
        });
        return model;
    };

//Gets a backbone collection by name
var getCollection = function(colId) {
        var col = _.find(root.collections, function(c) {
            return c.colId == colId;
        });
        return col;
    };

//Gets view by name
var getView = function(viewId) {
        var view = _.find(root.views, function(view) {
            return view.id == viewId;
        });
        return view;
    };
//Rest request which populates a specific model and triggers load event on success
var loadModel = function(modelId, url) {
        var model = getModel(modelId);
        model.fetch({
            url: url,
            success: function(resp) {
                fireEvent(modelId + ':load', resp);
            }
        })
    };

//Rest request which populates a specific collection and triggers load even on success
var loadCollection = function(colId, url) {
        var col = getCollection(colId);
        col.fetch({
            url: url,
            success: function(resp) {
                fireEvent(colId + ':load', resp);
            }
        });
    };

//Stores a custom event for delayed execution
var addEvent = function(name, func) {
        if (typeof func != 'function') return false;
        eventStore[name] = func;
    };

//Fires an event from the event store
var fireEvent = function(name, args) {
        eventStore[name].apply(args);
    };

//Controller namespace
bbko = {

    controller: function(opts) {

        root = this;
        //Init controller util functions
        this.getModel = getModel;
        this.createModel = createModel;
        this.loadModel = loadModel;
        this.createCollection = createCollection;
        this.loadCollection = loadCollection;
        this.on = addEvent;
        this.getView = getView;

        //private helper which calls a function
        var processAction = function(func, args) {
                if (typeof func == 'function') {
                    //Use apply inversion call in order to dynamically pass params
                    func.apply(args);
                    return true;
                }
                return false;
            };

        //Extend controller attributes passed in as configuration
        _.extend(this, opts);

       

        //By default the init function is always triggered
        if (window.location.pathname == '/') {
            var success = processAction(root['init'], root);
            if (!success) {
                console.error('unable to map route action init');
            }
        } else {
            //Extract the url path
            var path = window.location.pathname.split('/');
            //Invoke underscore's compact method to remove falsy elements
            var cleanPath = _.compact(path);
            //Extraact the action element from the url path
            var action = cleanPath[0].toLowerCase();
            /*
             *Loop through controller attributes and find function name matching action name
             * Took this approach to avoid case sensitive restrictions
             */
            _.each(root, function(value, key) {
                //Make sure match is a function as users may have simple attributes named the same as the function
                if (key.toLowerCase() == action && typeof root[key] == 'function') {
                    var success = processAction(root[key], root);
                    //stop iteration once there is a match
                    return false;
                }
            });
        }

         //Initialize view(s) if passed in the configuration
        _.each(this, function(value, key) {
            //Look for view property. Not case sensitive
            if (key.toLowerCase() == 'views') {
                //Once the view property is found, iterate through arrays and initialize backbone views
                _.each(root[key], function(viewConfig, index, array) {
                    var myView = Backbone.View.extend(viewConfig);
                    myView.prototype.controller = root; //add controller to view prototype
                    myView.prototype.koBind = bindView; //add bindviewmodel to view prototype
                    myView.prototype.tplBind = templateBind;
                    array[index] = new myView;
                });
                return false;
            }
        });

    }
};