## Canvas Course Manager

### Configuration

#### Application

Configuration for the project is currently managed using environment variables.
Docker handles the setting of key-value pairs in `docker-compose.yml`,
through the `environment` block and by consuming a `.env` file.
Docker will expect to find a `.env` file at the project's root directory.

This repository includes in the `config` directory a `.env.sample` template file for `.env`,
with the expected keys provided. Comments above each key describe what the value is used for,
and in some cases, indicate that the key-value pair is optional.

The `config.ts` module in the `ccm_web/server` directory validates this file,
using fallbacks when available and throwing an error if required values are not present.
The application will exit if any of the required configuration values are not set properly.

#### Canvas

Currently, the application can only be used with a Learning Tool Interoperability (LTI)
integration with a Canvas LMS instance. To set up the application in Canvas,
you must create an LTI Developer Key at the account level and then install the application
in "External Apps" at the course or account level through the appropriate "Settings" page.
Canvas has documentation related to
[creating an LTI Developer Key](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-configure-an-LTI-key-for-an-account/ta-p/140)
and [installing an external app](https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-configure-an-external-app-for-a-course-using-a-client/ta-p/1071)
(latter link is for course-level installation).
The client ID associated with the LTI Developer Key you create will be used when installing the application.
You will also need to specify the client ID -- as well as the Canvas instance URL -- in the `.env` configuration file
(see **Configuration - Application** above).

This project requires some specific values and settings to be included in the LTI Developer Key.
To simplify the creation of these keys, a JSON template called `lti_dev_key_sample.json` has
been provided in the `config` directory. Once replacing all instances of `{ccm_app_url}` with
the URL (without the protocol) for the instance you are configuring,
you can simply paste the JSON in the Canvas form.
(You will want to enter the Key Name and Owner Email separately.)

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
The file uses the same `.env` configuration file, so adjust any values there as needed
(see **Configuration** above for more info).
Note that, at minimum, the database host needs to be changed to `ccm_db_prod`
(since that is the name of the container).

Note: The `npm run prod` command in `ccm_web/package.json` allows you to run the application
in a similar (but not identical) way to how it would be in production within a container.
This exact command is not used in any Docker artifacts, and you would need some external
resources and environment variables set up for the command to function properly.

### Notice(s) regarding external code used

This repository contains modified portions of the npm package
[@types/ltijs](https://www.npmjs.com/package/@types/ltijs), which carries an MIT license.
See `ccm_web/server/localTypes/ltijs/index.d.ts` for more information and the modified code.
This code will hopefully only remain in this repository temporarily.
