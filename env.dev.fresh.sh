#!/bin/bash
set -ex
export CELOTERMINAL_NETWORK_ID=62320
export CELOTERMINAL_ACCOUNTS_DB_PATH=".celoterminal/celoaccounts-test-fresh.db"
export CELOTERMINAL_ACCOUNTS_DB="home/$CELOTERMINAL_ACCOUNTS_DB_PATH"
rm -f ~/"$CELOTERMINAL_ACCOUNTS_DB_PATH"
electron-forge start