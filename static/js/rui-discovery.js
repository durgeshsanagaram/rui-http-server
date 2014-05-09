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
(function(exports) {
    "use strict";

    function listToObject(list) {
        var object = {};
        for (var i = 0; i < list.length; ++i) {
            object[list[i]] = true;
        }
        return object;
    }

    function nodeToObject(node, options) {
        var allowed = listToObject(options.allowed);
        if (!options.multi) {
            options.multi = [];
        }
        var result = {};
        for (var i = 0; i < options.multi.length; ++i) {
            result[options.multi[i]] = [];
        }
        for (var i = 0; i < node.childNodes.length; ++i) {
            var child = node.childNodes[i];
            if (child.nodeName in allowed) {
                result[child.nodeName] = child.textContent;
            } else {
                console.log("Invalid child of <" + node.nodeName + ">: " +  child.nodeName);
            }
        }
        var valid = true;
        for (var i = 0; i < options.required.length; ++i) {
            var required = options.required[i];
            if (!(required in result)) {
                console.log("Invalid <" + node.nodeName + "> has no <" + required + ">");
                valid = false;
            }
        }
        return valid ? result : null;
    }

    function handleIcon(node) {
        if (node.nodeName !== "icon") {
            console.log("Invalid child of <iconList>: " + node.nodeName);
            return null;
        }
        return nodeToObject(node, {
            allowed: ["url", "width", "height", "mimetype", "depth"],
            required: ["url"]
        });
    }

    function handleProtocol(node) {
        return nodeToObject(node, {
            allowed: ["uri", "protocolInfo"],
            required: ["uri"],
            multi: ["uri"]
        });
    }

    function handleUI(ui_node) {
        var ui = {
            icons: [],
            protocols: []
        };
        for (var i = 0; i < ui_node.childNodes.length; ++i) {
            var child = ui_node.childNodes[i];
            switch (child.nodeName) {
            case "uiID":
                ui.id = child.textContent;
                break;
            case "name":
            case "description":
            case "fork":
            case "lifetime":
                ui[child.nodeName] = child.textContent;
                break;
            case "iconList":
                for (var j = 0; j < child.childNodes.length; ++j) {
                    var icon = handleIcon(child.childNodes[j]);
                    if (icon !== null) {
                        ui.icons.push(icon);
                    }
                }
                break;
            case "protocol":
                var protocol = handleProtocol(child);
                if (protocol !== null) {
                    ui.protocols.push(protocol);
                }
                break;
            default:
                console.log("Invalid child of <ui>: " + child.nodeName);
                break;
            }
        }
        return ui;
    }

    // From: http://stackoverflow.com/a/12965135/212555
    function resolve(url, base_url) {
        var doc = document
            , old_base = doc.getElementsByTagName('base')[0]
            , old_href = old_base && old_base.href
            , doc_head = doc.head || doc.getElementsByTagName('head')[0]
            , our_base = old_base || doc_head.appendChild(doc.createElement('base'))
            , resolver = doc.createElement('a')
            , resolved_url
            ;
        our_base.href = base_url;
        resolver.href = url;
        resolved_url  = resolver.href; // browser magic at work here

        if (old_base) old_base.href = old_href;
        else doc_head.removeChild(our_base);
        return resolved_url;
    }

    function fixRelativeURLs(ui, base_url) {
        for (var i = 0; i < ui.icons.length; ++i) {
            var icon = ui.icons[i];
            icon.url = resolve(icon.url, base_url);
        }
        for (var i = 0; i < ui.protocols.length; ++i) {
            var protocol = ui.protocols[i];
            protocol.uri = resolve(protocol.uri, base_url);
        }
    }

    function handleUIs(data) {
        this.uis = [];
        for (var i = 0; i < data.length; ++i) {
            var service = data[i];
            var parser = new DOMParser();
            var doc = parser.parseFromString(service.ui_listing, "text/xml");
            if (doc.documentElement.nodeName === "parsererror") {
                console.log("Invalid uilisting XML for service " + service.id, service.ui_listing);
                continue;
            }
            var uilist = doc.firstChild;
            if (uilist.nodeName !== "uilist") {
                console.log("Invalid uilisting XML for service " + service.id + ", the first child should be a <uilist>, but it is " + uilist.nodeName);
                continue;
            }
            for (var j = 0; j < uilist.childNodes.length; ++j) {
                var ui_node = uilist.childNodes[j];
                if (ui_node.nodeName !== "ui") {
                    console.log("Ignoring child of <uilist> with nodeName " + ui_node.nodeName);
                    continue;
                }
                var ui = handleUI(ui_node);
                fixRelativeURLs(ui, service.base_url);
                this.uis.push(ui);
            }
        }
        $(this).trigger("change", [this.uis]);
    }

    exports.RUIDiscoverer = function RUIDiscoverer(apiURL) {
        apiURL = apiURL || "api/remote-uis";
        var discoverer = {
            uis: {}
        };
        discoverer.getRUIs = $.getJSON.bind(this, apiURL, handleUIs.bind(discoverer));

        window.setInterval(discoverer.getRUIs, 5000);
        discoverer.getRUIs();
        return discoverer;
    }
})(window);
