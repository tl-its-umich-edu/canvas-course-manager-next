## Canvas Course Manager

### Development

Here are some basic set-up instructions.

1. Build a development image for the web application.
    ```
    docker-compose build
    ```

2. Start up the server and webpack for development.
    ```
    docker-compose up
    ```

3. Access the client by visiting `http://localhost:4000` in your browser of choice.

Use `^C` to stop the container and `docker-compose down` to remove the last used image from staging.

Many TypeScript and static file changes can be made without re-building the image,
but as necessary, rebuild the image using Step 1.

### Production

Taken together, all the stages in `ccm_web/Dockerfile` will build an optimized image for production.

You can build a production image, run a container, and use the application locally by performing
the following steps, replacing `{PORT}` with the port you want the application to run on:

1. Build one image with the server and static artifacts, including the bundled JavaScript frontend.

```
docker build -t ccm --build-arg PORT={PORT} ./ccm_web
```

2. Run a container with the image, exposing the application to `localhost`.

```
docker run --name ccm_cont --env PORT={PORT} -p {PORT}:{PORT} ccm
```

To stop the container created by 2), issue the following command:

```
docker stop ccm_cont
```

Note: The `npm run prod` command in `ccm_web/package.json` allows you to run as in production without Docker.
This exact command is not used in any Docker artifacts.
