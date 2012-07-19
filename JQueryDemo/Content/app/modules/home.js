(function() {
    $(function() {

        $('#btn-submit-form').click(function () {
            ui.validateForm('user-form');
        });

        //MODAL EXAMPLE
        $('#btn-modal').click(function () {
            ui.showModal({
                url: window.proxy.staticUrl + 'Content/ui/dialogs/registerdialog.html',
                Id: 'dialog-register',
                title: 'Register at dotNetMiami.com',
                submitCallback: function (data, modal) {
                    debugger;
                    if (window.ui.validateForm('registration-form')) {
                        ui.submitRequest({
                            method: 'POST',
                            url:'http://localhost:58364/register',
                            obj: data,
                            error: function () {
                                alert('request failed');
                            },
                            success: function (data) {
                                    
                            }
                        });
                    }
                }
            });
        });


    });

})();