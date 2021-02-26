# References:
# - https://docs.docker.com/develop/develop-images/multistage-build/
# - https://dev.to/chrsgrrtt/dockerising-a-next-js-project-1ck5

# Base stage (server)
FROM node:14-slim AS base
WORKDIR /base/
COPY package*.json ./
RUN npm install
COPY . .

ARG PORT
EXPOSE ${PORT}

# Build stage (build client and compile server to JS)
FROM base AS build
WORKDIR /build/
COPY --from=base /base ./
# Install dependencies to enable bundling with npm run build
RUN npm install ./client/
RUN npm run preprod

# Prod stage
FROM node:14-slim AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY --from=base /base/package.json ./
RUN npm install --production

COPY --from=build /build/dist/ ./server/
COPY --from=build /build/client/build/ ./client/build/

ARG PORT
EXPOSE ${PORT}
CMD node server/app.js

# Done!
