window.proxy = window.proxy || {
    svcUrl: window.location.protocol + '//' + window.location.host + '/',
    staticUrl: window.location.protocol + '//' + window.location.host + '/'
};

window.userData = {
    active:false,
    firstName : '',
    lastName:'',
    userId:''
}

window.ui = window.ui || {

    showModal: function(cfg) {
        if (!cfg.url) alert('Please specify widget url'); //Check for valid template url
        $('#' + cfg.Id).remove(); //Remove element if stale version still in dom
        var applySettings = function() {
                var finalData = {};
                //Standard submit handler
                $('[action="confirm"]').click(function() {
                    $('#' + cfg.Id).find('input[name], textarea[name], select[name]').each(function(index) {
                        if (!finalData[$(this).attr('name')]) {
                            finalData[$(this).attr('name')] = $(this).val();
                        }else{
                            finalData[$(this).attr('name') + index] = $(this).val();
                        }
                    });

                    //Consolidate input data as well as bound data
                    _.extend(finalData, cfg.data);
                    //Return everything back in the callback
                    if (cfg.submitCallback && typeof cfg.submitCallback == 'function') {
                        cfg.submitCallback(finalData, $('#' + cfg.Id));
                    }
                });

                if (cfg.afterRender && typeof cfg.afterRender == 'function') {
                    cfg.afterRender.apply($('#' + cfg.Id));
                }
            }

        var render = function(tmpl) {
                var config = {
                    dialogId: cfg.Id,
                    message: cfg.message ? cfg.message : '',
                    title: cfg.title ? cfg.title : ''
                };
                if (cfg.data) _.extend(cfg.data, config);

                //Convert template script to html using mustache framework. By the same token,
                //bind dataview to template
                var html = Mustache.to_html($(tmpl)[0].innerHTML, cfg.data ? cfg.data : config);

                if (!html) {
                    alert('error retrieving control');
                    return;
                }

                $('body').append(html);
                if (cfg.custSettings) {
                    $('#' + cfg.Id).css(cfg.custSettings);
                }
                $('#' + cfg.Id).modal({
                    backdrop: true,
                    keyboard: true
                });

                //Apply standard modal settings once the modal is rendered
                applySettings();
            };

        $.get(cfg.url, function(tmpl) {
            render(tmpl);
        });
    },

    //Helper function which helps validate bootstrap forms
    validateForm: function(formId) {
        var isFormValid = true;

        $('#' + formId).find('input[rules]').each(function() {
            if ($(this).attr('rules') == 'required' && $(this).val().length == 0) {

                //Reset error layout in case there is a repeat
                $(this).parent().find('span').remove();

                //Set error layout                
                $(this).parent().addClass('error').append('<span class="help-inline">required</span>');

                //Bind click event -> clears error layout
                $(this).click(function() {
                    $(this).parent().removeClass('error').find('span').remove();

                });
                //Invalidate form
                isFormValid = false;
            }
        });
        return isFormValid;
    },

    submitRequest: function(config) {

        //var employee = { id: config.obj };
        $.ajax({
            //use POST when dealing with .NET
            type: config.method || 'POST',
            //Determines if callback is as
            async: config.async,
            //ex: 'Users/GetUsers'
            url: config.url,
            //passing null will throw the error callback
            //if no paramaters, pass in null, else stringify the json object (requires json2.js) 
            data: (config.obj === null) ? '{}' : JSON.stringify(config.obj),

            //content type used with .NET
            contentType: "application/json; charset=utf-8",

            //default data type 
            dataType: config.dataType || "json",

            //if pre-send callback exists, use it, else use blank function
            beforeSend: config.pre ||
        function() {},

            //if error callback exists, use it, else use blank function
            error: config.err ||
        function() {},

            //success function recieves json data from data service
            success: function(data) {

                //verify success callback exists and is a function
                if (typeof config.succ === 'function') {
                    debugger;
                    //probably simple value - such as string - return solo value
                    config.succ(data);
                }
            }
        });
    },

    showLoadingPanel: function(options) {
        if (!options.url) {
            alert('Please provide url for the loading template');
            return false;
        }

        if (!options.data.panelId) {
            alert('Please provide an id for the loading panel');
        }

        $.get(options.url, function(tmpl) {

            var html = Mustache.to_html($(tmpl)[0].innerHTML, options.data);
            $('body').append(html);
            var loadingPanel = $('#' + options.data.panelId);
            if (options.containerId) {
                var container = $('#' + options.containerId)
                var top = (container.offset().top + (container.height() / 2) - (loadingPanel.height() / 1.3));
                var left = (container.offset().left + (container.width() / 2) - loadingPanel.width() / 2);

                loadingPanel.css({
                    'position': 'absolute',
                    'top': top,
                    'left': left,
                    'z-index': 3000
                });
            }
        });
    }
}