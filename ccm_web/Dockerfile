# References:
# - https://docs.docker.com/develop/develop-images/multistage-build/
# - https://dev.to/chrsgrrtt/dockerising-a-next-js-project-1ck5

# Base stage
FROM node:14-slim AS base
WORKDIR /base/
COPY package*.json wait-for-it.sh start.sh ./
RUN npm install
COPY . .

ARG PORT
EXPOSE ${PORT}

# Build stage (build client and compile server to JS)
FROM base AS build
WORKDIR /build/
COPY --from=base /base ./
RUN npm run preprod

# Prod stage
FROM node:14-slim AS prod
ENV NODE_ENV=production
RUN apt-get -q update && apt-get install netcat -y
WORKDIR /app

COPY --from=base /base/package.json /base/wait-for-it.sh /base/start.sh  ./
RUN npm install --production

COPY --from=build /build/dist/ ./

ARG PORT
EXPOSE ${PORT}
CMD ["sh", "-c", "./start.sh"]

# Done!
