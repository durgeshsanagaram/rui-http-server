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
static int port = 0;
static bool debug = false;

static const OptionEntry[] options = {
    { "port", 'p', 0, OptionArg.INT, ref port,
        "The port to run the HTTP server on. By default, the server picks a random available port.", "[port]" },
    { "debug", 'd', 0, OptionArg.NONE, ref debug,
        "Print debug messages to the ...console", null },
    { null }
};

static MainLoop loop;
static void safe_exit(int signal) {
    loop.quit();
}

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
        var server = new RUI.HTTPServer(port, debug);
        server.start();

        loop = new MainLoop();
        Posix.signal(Posix.SIGINT, safe_exit);
        Posix.signal(Posix.SIGHUP, safe_exit);
        Posix.signal(Posix.SIGTERM, safe_exit);
        loop.run();
    } catch (Error e) {
        stderr.printf("Error running RuiHttpServer: %s\n", e.message);
        return 1;
    }
    return 0;
}
