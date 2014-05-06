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
                list.append("<li id=\"" + ui.id + "\"><a href=\"" + ui.url + "\"><img src=\"" + ui.iconUrl + "\"/><span>" + ui.name + "</span></a></li>");
            }
        });
    }
    
    $(window).load(function() {
        window.setInterval(getRuis, 5000);
    });
    getRuis();
})();
