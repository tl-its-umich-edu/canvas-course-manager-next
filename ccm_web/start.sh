#!/bin/bash
set -e

if [ "${PROD}" == "True" ]; then
    echo "Executing production start commands"
    npm start
else
    echo "Executing test start commands"
    npm run dev
fi
