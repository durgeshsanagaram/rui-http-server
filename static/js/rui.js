(function() {
    "use strict";
    
    var DEFAULT_ICON = "images/default-icon.png";

    var uis = {};
    
    function getRuis() {
        $.get("api/remote-uis", function(data) {
            var list = $("#rui-list");
            var newUis = {};
            for (var i = 0; i < data.length; ++i) {
                var ui = data[i];
                if (!ui.iconUrl) {
                    ui.iconUrl = DEFAULT_ICON;
                }
                newUis[ui.id] = true;
                if (uis[ui.id]) {
                    var element = $("#rui-element-" + ui.id);
                    var link = element.find(".rui-link");
                    link.attr("href", ui.url);
                    element.find(".rui-name").text(ui.name);
                    element.find(".rui-icon").attr("src", ui.iconUrl);
                } else {
                    var element = $("<li/>", {
                        "class": "rui",
                        id: "rui-element-" + ui.id
                    });
                    var link = $("<a/>", {
                        "class": "rui-link",
                        href: ui.url
                    });
                    var icon = $("<img/>", {
                        "class": "rui-icon",
                        src: ui.iconUrl
                    });
                    icon.error(function() {
                        var icon = $(this);
                        if (icon.attr("src") !== DEFAULT_ICON) {
                            icon.attr("src", DEFAULT_ICON);
                        }
                    });
                    icon.appendTo(link);
                    $("<span/>", {
                        "class": "rui-name"
                    }).text(ui.name).appendTo(link);
                    link.appendTo(element);
                    element.appendTo(list);
                }
                uis[ui.id] = ui;
            }
            for (var key in uis) {
                if (!(key in newUis)) {
                    $("#rui-element-" + uis[key].id).remove();
                    delete uis[key];
                }
            }
        });
    }
    
    $(window).load(function() {
        window.setInterval(getRuis, 5000);
    });
    getRuis();
})();
