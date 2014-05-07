(function() {
    "use strict";
    
    var uis = {};
    
    function getRuis() {
        $.get("api/remote-uis", function(data) {
            var list = $("#ruiList");
            for (var i = 0; i < data.length; ++i) {
                var ui = data[i];
                if (uis[ui.id]) {
                    $("#" + ui.id).remove();
                }
                uis[ui.id] = ui;

                var element = $("<li/>", {
                    "class": "rui",
                    id: ui.id
                });
                var link = $("<a/>", {
                    "class": "rui-link",
                    href: ui.url
                });
                if (ui.iconUrl) {
                    $("<img/>", {
                        "class": "rui-icon",
                        src: ui.iconUrl
                    }).appendTo(link);
                }
                $("<span/>", {
                    "class": "rui-name"
                }).text(ui.name).appendTo(link);
                link.appendTo(element);
                element.appendTo(list);
            }
        });
    }
    
    $(window).load(function() {
        window.setInterval(getRuis, 5000);
    });
    getRuis();
})();
