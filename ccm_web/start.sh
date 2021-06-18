#!/bin/sh
echo "Running any un-applied migrations"
node server/src/migrator up
echo "Starting up the server"
node server/src/main.js
