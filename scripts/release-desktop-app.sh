#!/bin/sh
set -e

####################################################################################
# Build browser extension and desktop-app
####################################################################################

ROOT_DIR=$(dirname "$(readlink -f "$0")")
cd $ROOT_DIR
source ./utils.sh

if [ -z "${TARGET_PATH}" ]; then
  # Default TARGET_PATH
  TARGET_PATH="../projects/desktop-app"
fi

cd $TARGET_PATH
npm run app:make
