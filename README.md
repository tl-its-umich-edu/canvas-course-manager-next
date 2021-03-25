## Canvas Course Manager

### Configuration

Configuration for the project is currently managed using environment variables.
Docker handles the setting of key-value pairs in `docker-compose.yml`,
through the `environment` block and by consuming a `.env` file.

This repository includes `.env.sample` template file for `.env, with the expected keys listed out.
Comments above each key describe what the value is used for, and in some cases,
indicate that the key-value pair is optional.

The `config.ts` module in the `ccm_web/server` directory validates this file,
using fallbacks when available and throwing an error if required values are not present.
The application will exit if any of the configuration fails.

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

You can test the Docker production image and other production code branches by using `docker-compose-prod.yml`.
To do so, issue the same commands as above under **Development**
with the `-f` flag specifying `docker-compose-prod.yml`.
The file uses the same `.env` configuration file, so adjust any values there as desired
(see **Configuration** above for more info).

Note: The `npm run prod` command in `ccm_web/package.json` allows you to run the application
in a similar (but not identical) way to how it would be in production within a container.
This exact command is not used in any Docker artifacts.
