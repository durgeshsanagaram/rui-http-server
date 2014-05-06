using Gee;
using GUPnP;

internal class RuiHttpServer {
    struct RemoteUI {
        string id;
        string name;
        string description;
        string iconUrl;
        string url;
    }

    HashMap<string, RemoteUI?> remoteUis;

    RuiHttpServer() {
        remoteUis = new HashMap<string, RemoteUI?>();
    }

    void handle_compatible_uis(ServiceProxy service, ServiceProxyAction action) {
        try {
            string ui_listing;
            service.end_action(action,
                /* out */
                "UIListing", typeof(string), out ui_listing,
                null);
            Xml.Doc* doc = Xml.Parser.parse_memory(ui_listing, ui_listing.length);
            if (doc == null) {
                stderr.printf("Got bad UI listing.\n");
                return;
            }
            Xml.Node* root = doc->get_root_element();
            if (root == null) {
                stderr.printf("UI listing has no elements.\n");
                delete doc;
                return;
            }
            if (root->name != "uilist") {
                stderr.printf("UI listing doesn't start with a <uilist> element\n");
                delete doc;
                return;
            }
            for (Xml.Node* ui_element = root->children; ui_element != null; ui_element = ui_element->next) {
                if (ui_element->name != "ui") {
                    continue;
                }
                RemoteUI ui = RemoteUI();
                for (Xml.Node* child = ui_element->children; child != null; child = child->next) {
                    switch (child->name) {
                        case "uiID":
                            ui.id = child->get_content();
                            break;
                        case "name":
                            ui.name = child->get_content();
                            break;
                        case "description":
                            ui.description = child->get_content();
                            break;
                        case "iconList":
                            // TODO: Pick the best icon instead of the first one
                            bool found = false;
                            for (Xml.Node* icon = child->children; !found && icon != null; icon = icon->next) {
                                if (icon->name != "icon") {
                                    continue;
                                }
                                for (Xml.Node* ichild = icon->children; ichild != null; ichild = ichild->next) {
                                    if (ichild->name == "url") {
                                        ui.iconUrl = ichild->get_content();
                                        if (ui.iconUrl != null & ui.iconUrl.length > 0 && ui.iconUrl[0] == '/') {
                                            ui.iconUrl = new Soup.URI.with_base(service.get_url_base(), ui.iconUrl).to_string(false);
                                        }
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            break;
                        case "protocol":
                            // TODO: Make sure this has shortName="DLNA-HTML5-1.0" ?
                            for (Xml.Node* pchild = child->children; pchild != null; pchild = pchild->next) {
                                if (pchild->name == "uri") {
                                    ui.url = pchild->get_content();
                                    if (ui.url != null & ui.url.length > 0 && ui.url[0] == '/') {
                                        ui.url = new Soup.URI.with_base(service.get_url_base(), ui.url).to_string(false);
                                    }
                                }
                            }
                            break;
                    }
                }
                stdout.printf("Discovered UI:\n  id: %s\n  name: %s\n  iconUrl: %s\n  url: %s\n", ui.id, ui.name, ui.iconUrl, ui.url);
                remoteUis.set(ui.id, ui);
            }

            delete doc;
        } catch (Error e) {
            stderr.printf("Error from GetCompatibleUIs: %s\n", e.message);
            return;
        }
    }

    void service_proxy_available(ControlPoint control_point, ServiceProxy service) {
        service.begin_action("GetCompatibleUIs", handle_compatible_uis,
            /* in */
            "InputDeviceProfile", typeof(string), "",
            "UIFilter", typeof(string), "",
            null);
    }

    void start() throws Error{
        Context context = new Context(null, null, 0);

        ControlPoint control_point = new ControlPoint(context, "urn:schemas-upnp-org:service:RemoteUIServer:1");
        control_point.service_proxy_available.connect(service_proxy_available);
        control_point.set_active(true);

        stdout.printf("Starting DLNA Remote UI server service server on %s:%u\n", context.host_ip, context.port);
        MainLoop loop = new MainLoop();
        loop.run();
    }

    static int main(string[] args) {
        try {
            RuiHttpServer server = new RuiHttpServer();
            server.start();
        } catch (Error e) {
            stderr.printf("Error running RuiHttpServer: %s\n", e.message);
            return 1;
        }
        return 0;
    }
}
