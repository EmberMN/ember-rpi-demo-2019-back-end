#!/bin/bash

DEBUG=ember-rpi*,-*:verbose
echo "DEBUG=$DEBUG"

# Colors to make messages prettier :D
# See https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux#5947802
RED="\033[0;31m";
LIGHT_RED="\033[1;31m";
GREEN="\033[0;32m";
LIGHT_GREEN="\033[1;32m";
YELLOW="\033[1;33m";
BLUE="\033[0;34m";
LIGHT_BLUE="\033[1;34m";
CYAN="\033[0;36m";
LIGHT_CYAN="\033[1;36m";
PURPLE="\033[0;35m";
LIGHT_PURPLE="\033[1;35m";
WHITE="\033[1;37m";
U_WHITE="\033[4;37m";

WHITE_ON_BLUE="\033[1;97;44m";

NOCOLOR="\033[0m";

if [ ! -d $HOME/.nvm ];
then
    echo "\$HOME/.nvm does not appear to be a directory -- setting HOME=/root"
    HOME=/root
fi
echo "HOME=$HOME"

# Append
# If nvm isn't in the path then attempt to add it
if [[ ! $PATH == *"nvm/versions/node"* ]];
then
    NODE_INSTALLATIONS_ROOT_DIR="$HOME/.nvm/versions/node/"
    LAST_TOUCHED_NODE_BIN_DIR=$(ls -1dt $NODE_INSTALLATIONS_ROOT_DIR/*/bin|head -n 1)
    if [[ $LAST_TOUCHED_NODE_BIN_DIR ]];
    then
      echo -e "${YELLOW}NVM doesn't appear to be in PATH; adding $LAST_TOUCHED_NODE_BIN_DIR${NOCOLOR}"
      PATH="$PATH:$LAST_TOUCHED_NODE_BIN_DIR"
    else
      echo -e "${YELLOW}NVM doesn't appear to be in PATH; ${RED}couldn't locate any installations in ${NODE_INSTALLATIONS_ROOT_DIR}${NOCOLOR}"
      sleep 10s;
    fi
fi
echo "PATH=$PATH"


NPM_BIN=$(which npm)
echo "NPM_BIN=$NPM_BIN"
YARN_BIN=$(which yarn)
echo "YARN_BIN=$YARN_BIN"

PROG_DIR=$(dirname $(realpath "$0"))
NODE_MODULES_DIR=$PROG_DIR/node_modules
BUILD_DIR=$PROG_DIR/build

cd $PROG_DIR

LOG4JS_CONFIG=${LOG4JS_CONFIG:-log4js.json}
echo "LOG4JS_CONFIG=$LOG4JS_CONFIG"

SYNC_TIME=${SYNC_TIME:-false}
SHOW_TIMESTAMP=${SHOW_TIMESTAMP:-false}
SHOW_NETWORK_INFO=true
SHOW_SERIAL_PORTS=true

function print_timestamp() {
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    echo -en "${NOCOLOR}[${LIGHT_PURPLE}${TIMESTAMP}${NOCOLOR}] "
}

function log() {
    if $SHOW_TIMESTAMP
    then
        print_timestamp;
    fi
    echo -e "$1";
}

while [ 1 ]
do
    log "${YELLOW}Current user is:${NOCOLOR} ${RED}$(whoami)${NOCOLOR}"

    if [ ! -d $NODE_MODULES_DIR ]
    then
        log "${YELLOW}Installing dependencies${NOCOLOR}";
        $YARN_BIN
    fi

    if [ ! -f $BUILD_DIR/src/index.js ]
    then
        log "${YELLOW}Building from source${NOCOLOR}";
        $NPM_BIN run build
    fi

    if $SYNC_TIME
    then
        log "${YELLOW}Syncing clock...${NOCOLOR} $(date)";
        #sudo -S sh -c 'ntpdate -v 0.pool.ntp.org 1.pool.ntp.org 2.pool.ntp.org'
        sudo ntpdate -v 0.pool.ntp.org 1.pool.ntp.org 2.pool.ntp.org
        log "${YELLOW}Done!${NOCOLOR} $(date)";
    fi

    if $SHOW_NETWORK_INFO
    then
        IP_ADDRESSES=($(ip addr | awk ' !/127.0.0.1/ && !/169.254/ && /inet / { gsub(/\/.*/, "", $2); printf "%s ", $2 }'))
        log "${YELLOW}IPv4 addresses:${NOCOLOR} ${IP_ADDRESSES[*]}";

        # netstat -ant4|grep LISTEN|grep -v "127."
        PORTS=($(ss -nlt4|awk -F'[ :]+' 'NR > 1 { print $5 }'))
        IFS=$'\n'
        SORTED_PORTS=($(sort -u -k1,1n <<<"${PORTS[*]}"))
        unset IFS
        #FORMATTED_PORTS=$(IFS=", ", ; echo -e "${PORTS[*]}");
        log "${YELLOW}Listening TCP ports:${NOCOLOR} ${SORTED_PORTS[*]}"
    fi

    if $SHOW_SERIAL_PORTS
    then
        if [ ! -x "$(which serialport-list)" ]
        then
            log "${YELLOW}Installing @serialport/list${NOCOLOR}";
            $NPM_BIN install -g @serialport/list
        fi
        #PORTS=($(npx -q @serialport/list))
        PORTS=($(serialport-list))
        log "${YELLOW}Serial ports:${NOCOLOR} ${PORTS[*]}";
    fi

    [[ -x "$(which jq)" ]] && VERSION=$(jq -r .version $PROG_DIR/package.json) || VERSION="?"
    [[ -x "$(which jq)" ]] && PROG_NAME=$(jq -r .name $PROG_DIR/package.json) || PROG_NAME="Scanning TPC control interface"
    log "${LIGHT_GREEN}Starting ${LIGHT_CYAN}${PROG_NAME}${NOCOLOR} ${U_WHITE}v${VERSION}${NOCOLOR}"

    LOG4JS_CONFIG=$LOG4JS_CONFIG DEBUG=$DEBUG $NPM_BIN run start

    log "${LIGHT_RED}Program terminated${NOCOLOR} (will try to restart after 5s delay)"
    sleep 5s
done
