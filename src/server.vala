using GUPnP;

void service_proxy_available(ControlPoint control_point, ServiceProxy service) {
    stdout.printf("Service proxy available!\n");
    try {
        string ui_listing;
        service.send_action("GetCompatibleUIs",
            /* in */
            "InputDeviceProfile", typeof(string), "",
            "UIFilter", typeof(string), "",
            null,
            /* out */
            "UIListing", typeof(string), out ui_listing,
            null);
        stdout.printf("Got UI listing: %s\n", ui_listing);
    } catch (Error e) {
        stderr.printf("Error from GetCompatibleUIs: %s\n", e.message);
        return;
    }
}

int main(string[] args) {
    Context context;
    try {
        context = new Context(null, null, 0);
    } catch (Error e) {
        stderr.printf("Error creating GUPnP context: %s\n", e.message);
        return 1;
    }

    ControlPoint control_point = new ControlPoint(context, "urn:schemas-upnp-org:service:RemoteUIServer:1");
    control_point.service_proxy_available.connect(service_proxy_available);
    control_point.set_active(true);

    stdout.printf("Starting DLNA Remote UI server service server on %s:%u\n", context.host_ip, context.port);
    MainLoop loop = new MainLoop();
    loop.run();
    return 0;
}
