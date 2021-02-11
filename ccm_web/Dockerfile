# Establish base image to build upon
FROM node:14-slim AS node
WORKDIR /app/

EXPOSE 3333

COPY . /app/

RUN npm install

# Make conditional on prod?
RUN npm run build

CMD ["/bin/bash", "start.sh"]

# Done!
