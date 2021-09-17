#!/bin/sh
set -e

echo "Running any un-applied migrations"
node server/src/migrator up

echo "Checking initialization and config before clustering"
node server/src/init.js

echo "Starting pm2 cluster"
exec pm2-runtime ecosystem.config.js
