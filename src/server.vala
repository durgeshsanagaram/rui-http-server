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
public class RUI.HTTPServer {

    int port;
    bool debug;
    Discoverer discoverer;
    Soup.Server server;

    public HTTPServer(int port = 0, bool debug = false) {
        this.port = port;
        this.debug = debug;
        this.discoverer = new Discoverer(debug);
        this.server = new Soup.Server(Soup.SERVER_PORT, port, null);
        server.add_handler(null, handle_static_file);
        server.add_handler("/api/remote-uis", handle_rui_request);
    }

    void handle_rui_request(Soup.Server server, Soup.Message message,
            string path, HashTable? query, Soup.ClientContext context) {
        Json.Builder builder = new Json.Builder();
        builder.begin_array();
        foreach (var service in discoverer.services) {
            builder.begin_object();
            builder.set_member_name("id");
            builder.add_string_value(service.id);
            builder.set_member_name("ui_listing");
            builder.add_string_value(service.ui_listing);
            builder.set_member_name("base_url");
            builder.add_string_value(service.base_url);
            builder.end_object();
        }
        builder.end_array();
        
        Json.Generator generator = new Json.Generator();
        generator.set_pretty(true);
        generator.set_root(builder.get_root());
        string data = generator.to_data(null);
        message.set_status(Soup.Status.OK);
        message.set_response("application/json", Soup.MemoryUse.COPY, data.data);
    }
    
    void handle_static_file(Soup.Server server, Soup.Message message,
            string path, HashTable? query, Soup.ClientContext context) {
        server.pause_message(message);
        handle_static_file_async.begin(server, message, path, query, context);
    }

    async void handle_static_file_async(Soup.Server server,
            Soup.Message message, string path, HashTable? query,
            Soup.ClientContext context) {
        if (path == "/" || path == "") {
            path = "index.html";
        }
        var file = File.new_for_path("static/" + path);
        try {
            var info = yield file.query_info_async("*", FileQueryInfoFlags.NONE);
            var io = yield file.read_async();
            Bytes data;
            while ((data = yield io.read_bytes_async((size_t)info.get_size())).length > 0) {
                message.response_body.append(Soup.MemoryUse.COPY,
                    data.get_data());
            }
            string content_type = info.get_content_type();
            message.set_status(Soup.Status.OK);
            message.response_headers.set_content_type(content_type, null);
        } catch (IOError.NOT_FOUND e) {
            message.set_status(404);
            message.set_response("text/plain", Soup.MemoryUse.COPY,
                ("File " + file.get_path() + " does not exist.").data);
        } catch (Error e) {
            if (debug) {
                stderr.printf("Failed to read file %s: %s\n", file.get_path(),
                    e.message);
            }
            message.set_status(500);
            message.set_response("text/plain", Soup.MemoryUse.COPY,
                e.message.data);
        } finally {
            server.unpause_message(message);
        }
    }

    public void start() throws Error{
        discoverer.start();
        server.run_async();
        stdout.printf("Starting HTTP server on http://localhost:%u\n",
            server.port);
    }
}
