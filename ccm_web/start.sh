#!/bin/sh
echo "running the migrations"
node server/src/migrator up
echo "Starting up the server"
node server/src/main.js
