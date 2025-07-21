#!/bin/bash

echo "qworker is starting..."

# Wait for backend to be ready since supervisor will spawn all the 3 processes backend, qworker, and frontend same time
while [ ! -f /tmp/backend_ready ]; do
    echo 'qworker: Waiting for backend to be ready...'
    sleep 2
done

# this is to ensure that the backend/DB is fully ready before starting the qworker
echo "qworker: Backend is ready, starting qworker..."
if [ "$RUN_QWORKER_DEV_MODE" = "true" ]; then
    echo 'qworker: Running in DEV mode'
    rm /tmp/backend_ready
    watchfiles --filter python 'python manage.py qcluster' /code/backend/ccm/background_tasks
else
    echo 'qworker: Running in PROD mode'
    python manage.py qcluster
fi

