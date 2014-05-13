## Dependencies

### Ubuntu 14.04

    sudo apt-get install git valac libgupnp-1.0-dev libgee-0.8-dev libjson-glib-dev

    # tup build tool
    # see: http://gittup.org/tup/
    sudo apt-add-repository 'deb http://ppa.launchpad.net/anatol/tup/ubuntu precise main'
    sudo apt-get update
    sudo apt-get install tup

### Fedora 20

    sudo yum install fuse-devel gupnp-devel libgee-devel vala

    # setup Tup
    git clone git://github.com/gittup/tup.git
    cd tup
    ./bootstrap.sh

    sudo ln -s $PWD/tup /usr/local/bin/tup
    cd ..

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

    ./src/server -p 8080

If you want a random point, you can do:

    ./src/server

And, the server output will say something like:

> Starting HTTP server on http://localhost:37229

Visit that page in your browser to see the discovered remote UIs.
