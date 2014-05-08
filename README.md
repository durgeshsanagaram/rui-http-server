## Dependencies

On Ubuntu 14.04:

    sudo apt-get install git valac libgupnp-1.0-dev libgee-dev libjson-glib-dev

    # tup build tool
    # see: http://gittup.org/tup/
    sudo apt-add-repository 'deb http://ppa.launchpad.net/anatol/tup/ubuntu precise main'
    sudo apt-get update
    sudo apt-get install tup

## Get Source

    git clone https://github.com/cablelabs/rui-http-server.git
    cd rui-http-server

## Build

    tup init
    tup upd

While developing, it can be useful to leave `tup` running in the background, autocompiling every time anything changes:

    tup monitor -a
    # stop with 'tup stop'

## Run

To start the HTTP server on port 8080, do:

    ./server -p 8080

If you want a random point, you can do:

    ./server

And, the server output will say something like:

> Starting HTTP server on http://localhost:37229

Visit that page in your browser to see the discovered remote UIs.
