#!/bin/bash
set -x
ls -la .webpack/
if [ ! -d ".webpack/main" ]; then
	mv .webpack/*/* .webpack/
	ls -la .webpack/
fi
