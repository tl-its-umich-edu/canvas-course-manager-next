# References:
# - https://docs.docker.com/develop/develop-images/multistage-build/
# - https://dev.to/chrsgrrtt/dockerising-a-next-js-project-1ck5

# Base stage
FROM node:20-slim AS base
WORKDIR /base/

COPY package*.json ./
RUN npm install
COPY . .

ARG PORT
EXPOSE ${PORT}

# Build stage (build client and compile server to JS)
FROM node:20-slim AS build
WORKDIR /build/

COPY --from=base /base ./
RUN npm run build

# Prod stage
FROM node:20-slim AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY --from=base \
    /base/package.json \
    /base/package-lock.json \
    /base/start.sh \
    /base/ecosystem.config.js \
    ./
RUN npm install --production
RUN npm install pm2@5.3.1 -g
COPY --from=build /build/dist/ ./

# Set PM2_HOME so that .pm2 files are written in /tmp/
ENV PM2_HOME=/tmp/.pm2
ARG PORT
EXPOSE ${PORT}
ENTRYPOINT ["./start.sh"]

# Done!
