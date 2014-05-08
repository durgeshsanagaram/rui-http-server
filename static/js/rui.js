/* Copyright (c) 2014, CableLabs, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
/*jslint browser: true, node: true, plusplus: true, vars: true, white: true,
  indent: 4, maxlen: 80, jquery: true */
/*jshint strict: true, shadow: true, camelcase: true, curly: true,
  quotmark: double, latedef: true, undef: true, unused: true, trailing: true */
(function() {
    "use strict";
    
    var DEFAULT_ICON = "images/default-icon.png";

    var uis = {};
    var badImages = {};
    
    function getRuis() {
        $.getJSON("api/remote-uis", function(data) {
            var list = $("#rui-list");
            var newUis = {};
            for (var i = 0; i < data.length; ++i) {
                var ui = data[i];
                ui.icons.sort(function(a, b) {
                    if (a.width && b.width) {
                        return a.width - b.width;
                    }
                    if (a.height && b.height) {
                        return a.height - b.height;
                    }
                    return 0;
                });
                ui.icons.next = function() {
                    var icon;
                    while (icon = this.pop()) {
                        if (!(icon.url in badImages)) {
                            return icon.url;
                        }
                    }
                    return DEFAULT_ICON;
                }
                newUis[ui.id] = true;
                if (uis[ui.id]) {
                    var element = $("#rui-element-" + ui.id);
                    var link = element.find(".rui-link");
                    link.attr("href", ui.url);
                    element.find(".rui-name").text(ui.name);
                    element.find(".rui-icon").attr("src", ui.icons.next());
                } else {
                    var element = $("<li/>", {
                        "class": "rui",
                        id: "rui-element-" + ui.id
                    });
                    var link = $("<a/>", {
                        "class": "rui-link",
                        href: ui.url
                    });
                    $("<span/>", {
                        "class": "rui-number"
                    }).appendTo(link);
                    var frame = $("<div/>", {
                        "class": "rui-frame"
                    });
                    frame.appendTo(link);
                    var icon = $("<img/>", {
                        "class": "rui-icon",
                        src: ui.icons.next()
                    });
                    icon.data("ui", ui);
                    icon.error(function() {
                        var icon = $(this);
                        var ui = icon.data("ui");
                        console.log("Failed to load icon: " + icon.attr("src"));
                        badImages[icon.attr("src")] = true;
                        var nextUrl = ui.icons.next();
                        if (icon.attr("src") !== nextUrl) {
                            icon.attr("src", nextUrl);
                        }
                    });
                    icon.appendTo(frame);
                    $("<span/>", {
                        "class": "rui-name"
                    }).text(ui.name).appendTo(frame);
                    link.appendTo(element);
                    element.appendTo(list);
                }
                uis[ui.id] = ui;
            }
            var elements = list.children();
            for (var i = 0; i < elements.length; ++i) {
                $(elements[i]).find(".rui-number").text(i);
            }
            for (var key in uis) {
                if (!(key in newUis)) {
                    $("#rui-element-" + key).remove();
                    delete uis[key];
                }
            }
        });
    }
    
    $(window).load(function() {
        window.setInterval(getRuis, 5000);
        getRuis();
    });
})();
