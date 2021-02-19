# References: 
# - https://dev.to/chrsgrrtt/dockerising-a-next-js-project-1ck5
# - https://docs.docker.com/develop/develop-images/multistage-build/

# Base stage
FROM node:14-slim AS base
WORKDIR /base/
COPY package*.json ./
RUN npm install
COPY . .

ARG PORT
EXPOSE ${PORT}

# Build stage
FROM base AS build
ENV NODE_ENV=production
WORKDIR /build/
COPY --from=base /base ./
RUN npm run build

# Prod stage
FROM node:14-slim AS prod
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /build/package*.json ./
COPY --from=build /build/.next ./.next
COPY --from=build /build/public ./public
RUN npm install next

ARG PORT
EXPOSE ${PORT}
CMD npm run start

# Done!
