#!/bin/bash
if [ ! -d ".webpack/main" ]; then
	mv .webpack/*/* .webpack/
fi