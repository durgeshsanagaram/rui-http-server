static int port = 0;
static bool debug = false;

static const OptionEntry[] options = {
    { "port", 'p', 0, OptionArg.INT, ref port,
        "The port to run the HTTP server on. By default, the server picks a random available port.", "[port]" },
    { "debug", 'd', 0, OptionArg.NONE, ref debug,
        "Print debug messages to the console", null },
    { null }
};

static int main(string[] args) {
    try {
        var opt_context = new OptionContext("RUI Discovery Server");
        opt_context.set_help_enabled (true);
        opt_context.add_main_entries (options, null);
        opt_context.parse (ref args);
    } catch (OptionError e) {
        stderr.printf ("%s\n", e.message);
        stderr.printf ("Run '%s --help' to see a full list of available command line options.\n",
            args[0]);
        return 2;
    }
    try {
        RuiHttpServer server = new RuiHttpServer(port, debug);
        server.start();
    } catch (Error e) {
        stderr.printf("Error running RuiHttpServer: %s\n", e.message);
        return 1;
    }
    return 0;
}
