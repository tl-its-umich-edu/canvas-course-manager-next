#!/bin/bash 

# Log when backend starts
echo "Backend starting..."

# Case insenstive match
shopt -s nocaseglob

echo "$DJANGO_SETTINGS_MODULE"

if [ -z "${GUNICORN_WORKERS}" ]; then
    GUNICORN_WORKERS=4
fi

if [ -z "${GUNICORN_PORT}" ]; then
    GUNICORN_PORT=4001
fi

if [ -z "${GUNICORN_TIMEOUT}" ]; then
    GUNICORN_TIMEOUT=120
fi

if [ -z "${DB_HOST}" ]; then
    DB_HOST=ccm_db
fi

if [ -z "${DB_PORT}" ]; then
    DB_PORT=3306
fi

# To have a more static default secret key, this should still be defined
if [ -z "${DJANGO_SECRET_KEY}" ]; then
    export DJANGO_SECRET_KEY=`python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
    echo "DJANGO_SECRET_KEY not set, using random value"
fi

echo "backend: Waiting for DB ${DB_HOST} at ${DB_PORT}"
while ! nc -z "${DB_HOST}" "${DB_PORT}"; do
  sleep 2 # wait 2 seconds before check again
done

echo "backend: Running python migrations"
python manage.py migrate
echo "backend:Django migrations completed."

if [ "${DEBUGPY_ENABLE:-"false"}" == "false" ]; then
    echo "backend: Starting Gunicorn with uvicorn worker for production"
    CMD="gunicorn backend.asgi:application --bind 0.0.0.0:${GUNICORN_PORT} --workers=${GUNICORN_WORKERS} -k uvicorn_worker.UvicornWorker --timeout=${GUNICORN_TIMEOUT} "
else
    echo "backend: Starting uvicorn for Development"
    CMD="uvicorn backend.asgi:application --host=0.0.0.0 --port=${GUNICORN_PORT} --reload"
fi
# Signal backend is ready for qworker
touch /tmp/backend_ready
exec $CMD
echo "Backend finished starting up."
# End of backend startup script
