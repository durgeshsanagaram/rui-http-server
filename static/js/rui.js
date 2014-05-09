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

    var ruiDiscoverer = new RUIDiscoverer();
    var uis = {};
    var badImages = {};

    var setInitialHeight = false;
    var visibleUIs = 0;
    function updateRUIListHeight() {
        // Set RUI list height so we don't show cut-off elements
        var selected = $(".selected");
        if (selected.length === 0) {
            return;
        }
        var childHeight = selected.outerHeight();
        var ruiList = $("#rui-list");
        visibleUIs = Math.floor(ruiList.outerHeight(true) / childHeight);
        var padding = ruiList.outerHeight(true) - visibleUIs * childHeight;
        ruiList.css("margin-bottom", padding);
        setInitialHeight = true;
        scrollToSelected();
    }
    $(window).resize(function() {
        updateRUIListHeight();
    });

    function updateSelectedHighlight() {
        var selected = $(".selected");
        var ruiList = $("#rui-list");
        var elements = ruiList.children();
        if (selected.length === 0) {
            if (elements.length === 0) {
                return;
            }
            selected = elements.first();
            selected.addClass("selected");
        }
        for (var i = 0; i < elements.length; ++i) {
            var element = $(elements[i]);
            element.data("index", i);
        }
        if (!setInitialHeight) {
            updateRUIListHeight();
        }
    }

    function scrollToSelected() {
        var scrollTarget = $(".selected");
        // Try to keep the selected element in the center of the screen
        for (var i = 0; i < Math.floor(visibleUIs / 2); ++i) {
            if (scrollTarget.prev().length !== 0) {
                scrollTarget = scrollTarget.prev();
            }
        }
        var ruiList = $("#rui-list");
        ruiList.stop();
        ruiList.animate({
            scrollTop: scrollTarget.outerHeight(true) * scrollTarget.data("index")
        });
    }

    $(ruiDiscoverer).on("change", function(event, data) {
        var list = $("#rui-list");
        var newUis = {};

        // Add or update UIs
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
                if (ui.protocols.length > 0) {
                    link.attr("href", ui.protocols[0].uri);
                }
                element.find(".rui-name").text(ui.name);
                element.find(".rui-icon").attr("src", ui.icons.next());
                element.data("ui", ui);
            } else {
                var element = $("<li/>", {
                    "class": "rui",
                    id: "rui-element-" + ui.id
                });
                element.data("ui", ui);
                var link = $("<a/>", {
                    "class": "rui-link"
                });
                if (ui.protocols.length > 0) {
                    link.attr("href", ui.protocols[0].uri);
                }
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

        // Remove UIs that don't exist anymore
        for (var key in uis) {
            if (!(key in newUis)) {
                var element =  $("#rui-element-" + key);
                element.prev().addClass("selected");
                element.remove();
                delete uis[key];
            }
        }

        // Add element numbers
        var elements = list.children();
        for (var i = 0; i < elements.length; ++i) {
            var element = $(elements[i]);
            element.find(".rui-number").text(i + 1);
            element.data("index", i);
        }
        updateSelectedHighlight();
    });

    var keyCodeMap = {
        13: "Enter",
        38: "Up",
        40: "Down"
    };
    for (var i = 0; i <= 9; ++i) {
        keyCodeMap[i + 48] = i.toString();
    }
    $(window).load(function() {
        $(document.body).keydown(function(event) {
            var selected = $(".selected");
            if (selected.length === 0) {
                return;
            }
            var next = null;
            var key = event.key || keyCodeMap[event.keyCode];
            switch (key) {
            case "Up":
                next = selected.prev();
                break;
            case "Down":
                next = selected.next();
                break;
            case "Enter":
                window.location = selected.data("ui").protocols[0].uri;
                return;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                var i = parseInt(key) - 1;
                var target = $("#rui-list").children()[i];
                if (target) {
                    window.location = $(target).data("ui").protocols[0].uri;
                }
                return;
            }
            // Don't scroll using arrow keys
            event.preventDefault();
            if (next === null || next.length === 0) {
                return;
            }
            selected.removeClass("selected");
            next.addClass("selected");
            updateSelectedHighlight();
            scrollToSelected();
        });
    });
})();
