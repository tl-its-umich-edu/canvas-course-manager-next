# References:
# - https://docs.docker.com/develop/develop-images/multistage-build/
# - https://dev.to/chrsgrrtt/dockerising-a-next-js-project-1ck5

# Base stage
FROM node:14-slim AS base
RUN apt-get -q update && apt-get -qy install netcat
# RUN apt-get -q update && apt-get -qy install netcat wget && \
    # wget -qO- https://raw.githubusercontent.com/eficode/wait-for/v2.1.2/wait-for | sh -s -- google.com:80 -- echo success
WORKDIR /base/
COPY package*.json wait-for wait-for-it.sh start.sh ./
RUN npm install
COPY . .

ARG PORT
EXPOSE ${PORT}

# Build stage (build client and compile server to JS)
FROM base AS build
RUN apt-get -q update && apt-get -qy install netcat
WORKDIR /build/
COPY --from=base /base ./
RUN npm run preprod

# Prod stage
FROM node:14-slim AS prod
ENV NODE_ENV=production
RUN apt-get -q update && apt-get install netcat -y
WORKDIR /app

COPY --from=base /base/package.json /base/wait-for  /base/wait-for-it.sh /base/start.sh  ./
RUN npm install --production

COPY --from=build /build/dist/ ./

ARG PORT
EXPOSE ${PORT}
# CMD ["sh", "-c", "node server/src/migrator up && node server/src/main.js"]
CMD ["sh", "-c", "./start.sh"]

# Done!
