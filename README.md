## Dependencies

On Ubuntu 14.04:

    sudo apt-get install valac libgupnp-devel

    # tup build tool
    # see: http://gittup.org/tup/
    sudo apt-add-repository 'deb http://ppa.launchpad.net/anatol/tup/ubuntu precise main'
    sudo apt-get update
    sudo apt-get install tup

## Build

    tup upd

## Run

    ./server
