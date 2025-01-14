
# FROM directive instructing base image to build upon
# This could be used as a base instead: 
# https://hub.docker.com/r/nikolaik/python-nodejs
FROM python:3.13-slim

# NOTE: requirements.txt not likely to change between dev builds
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    netcat-openbsd \
    vim-tiny \
    jq \
    python3-dev \
    git \
    supervisor \
    curl \
    pkg-config && \
    apt-get upgrade -y && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/*

# Install MariaDB from the mariadb repository rather than using Debians 
# https://mariadb.com/kb/en/mariadb-package-repository-setup-and-usage/
RUN curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | bash && \
apt install -y --no-install-recommends libmariadb-dev

RUN pip install --no-cache-dir -r requirements.txt
WORKDIR /code/ccm_web

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt install -y nodejs

COPY ccm_web/package*.json /code/ccm_web
RUN npm install

WORKDIR /code

# Sets the local timezone of the docker image
ARG TZ
ENV TZ ${TZ:-America/Detroit}
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# EXPOSE port 4000 to allow communication to/from server
EXPOSE 4000

# NOTE: project files likely to change between dev builds
COPY . .

CMD ["/usr/bin/supervisord", "-c", "/code/supervisor_docker.conf"]
# done!
