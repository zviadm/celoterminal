#!/bin/bash
set -ex
yarn build
mv ./dist/latest-mac.yml ./dist/latest-mac.arm64.yml
yarn compile --arch x64
yarn build:x64