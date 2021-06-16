#!/bin/sh
echo "running the migrations"
node server/src/migrator up
echo "starting the server up"
node server/src/main.js