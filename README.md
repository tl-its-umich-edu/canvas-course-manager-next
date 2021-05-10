## Canvas Course Manager

### Overview

The application is primarily written in [TypeScript](https://www.typescriptlang.org/)
and makes use of the [React framework](https://reactjs.org/) for the client and
the [Nest framework](https://docs.nestjs.com/) for the NodeJS server.

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

#### Installation and usage

Once you have fully configured the application (see the **Configuration** section above),
you can use the following steps to build and run the application using Docker.

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

#### Step By Step

Explicit steps for setting up CCM in a development environment.

1. `ngrok http 4000`

2. `curl --silent http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'`
   Copy the hostname of the `ngrok` instance for use later.  Get only the hostname, not the `http`/`https` scheme prefix.

3. `cp config/.env.sample .env`

4. Edit new `.env` file to add or replace settings from the sample.

   `vim .env`

5. `cp config/lti_dev_key_sample.json lti_dev_key.json`

6. Edit new `lti_dev_key.json` file to add or replace settings from the sample.  Replace all occurrences of `{ccm_app_url}` with the hostname copied in the earlier step.

   `vim lti_dev_key.json`

7. Go to Canvas "Developer Keys" management page at (https://umich.instructure.com/accounts/1/developer_keys).  Click the button for "+ Developer Key", then "+ LTI Key".

8. When the "Key Settings" modal appears, select "Paste JSON" from the "Method" menu in the "Configure" section.  Then copy the contents of `config/lti_dev_key.json` and paste it into the "LTI 1.3 Configuration" field.

9. *Recommended:* Enter a name for the application in the "Key Name" field and an email address in the "Owner Email" field.

10. Click the "Save" button.

11. *Optional:* LTI Key, use "Manual Entry" under the "Method" menu to access "LTI Advantage Services" under the "Configuration" section.  Enable all options, then click the "Save" button.

    1. Note:  After saving, using "Paste JSON" under the "Method" menu, will show the corresponding JSON for the LTI Advantage configuration changes.  Enabling the LTI Advantage options adds them to the `scopes` key of the JSON.

12. Copy the ID number of the LTI key created in Canvas.  The ID is the long number shown in the "Details" column of the "Developer Keys" page.  It usually looks like `17700000000000nnn`.

13. Edit the `.env` file

    1. Verify the`LTI_PLATFORM_URL` variable value is correct for the instance of Canvas used.
    2. Add to the `LTI_CLIENT_ID` variable value the LTI key ID number copied in the earlier step.

14. Build and start the application with docker-compose.

    1. `docker-compose build`
    2. *Optional:* The very first time the database container starts, it takes some time to set itself up, during which it will not accept connections from the application container.  The application container then fails, which prevents it from creating tables in the DB it will need later.  A solution that seems to work is to start the database container alone first, letting it run in detached mode for a few minutes before starting the application.
       `docker-compose up -d -- database`
    3. `docker-compose up`

15. Add the app to a course.  Go to (https://umich.instructure.com/courses/nnnnnn/settings/configurations), where "nnnnnn" is the course ID.
    1. Under the "Apps" tab, click the "+App" button.
    2. In the "Configuration Type" menu, select "By Client ID".
    3. In the "Client ID" field, paste in the same ID number that was added to `.env` above.
    4. When prompted to verify the ID for the tool, click the "Install" button.

#### Troubleshooting

1. ***Error:***
   ```txt
   ccm_web     | Error during deployment:  ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 172.18.0.2:3306
   ```
   This may happen when the application is run for the very first time. It appears that during the first run of the app, the DB pod requires time to set up before it's ready.  The web pod is unable to connect to the DB, therefore its server shuts down.
   ***Solution:***  Stop and restart the Docker containers.
   
2. ***Error:***
   ```txt
   ccm_web     | (node:64) UnhandledPromiseRejectionWarning: Error: An error occurred while setting up ltijs: Error: MISSING_PLATFORM_URL_OR_CLIENTID
   ccm_web     |     at /base/server/src/lti/lti.middleware.ts:22:15
   ccm_web     |     at processTicksAndRejections (internal/process/task_queues.js:93:5)
   ```
   
   This happens when the LTI key is not configured or configured improperly.
   ***Solution:***  Follow the steps documented above to ensure the key is configured correctly, then start the application again.
   
3. ***Error:***

   ```txt
   ccm_db      | 2021-05-05T19:46:18.445529Z 3 [Warning] InnoDB: Cannot open table ccm/platformStatuses from the internal data dictionary of InnoDB though the .frm file for the table exists. Please refer to http://dev.mysql.com/doc/refman/5.7/en/innodb-troubleshooting.html for how to resolve the issue.
   ccm_web     | Error during deployment:  DatabaseError [SequelizeDatabaseError]: Table 'ccm.platformStatuses' doesn't exist
   ```

   This may occur if the application has been run without being fully configured before.  The DB may have been left in an invalid state.
   When investigated, some DB clients show that table `platformStatuses` is known, but when it is queried, an error like `SQL Error [1146] [42S02]: Table 'ccm.platformStatuses' doesn't exist` is given.

   ***Solution:***  Stop the Docker containers, delete the `.mysql_data` directory, optionally delete the Docker images, then rebuild all again.  Be sure the LTI key is properly configured before running the application again.

#### Debugging using VS Code

1. Go to the Run and Debug option in the left navigation of VS Code editor.
2. Select the configuration CCM_DEBUG and click the Play button. The debugger should then be attached.
3. Add a break point anywhere in the server folder and code execution will stop at that break point.
4. The debugger will reattach if you change the code in the server.  This supports code and debug simultaneously.
5. For more information, see "[Node.js debugging in VS Code](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)" on the official documentation website.

#### Running unit tests

The backend application includes some unit and end-to-end tests built using Nest tooling
as well as [Jest](https://jestjs.io/) and [Supertest](https://github.com/visionmedia/supertest).
To run the test suites, do the following:

1. Start up the application using the steps above, and then in a separate terminal window,
enter the container using `docker exec`.

    ```
    docker exec -it ccm_web /bin/bash
    ````

2. Run one of a handful of test commands defined in `package.json` under `scripts`.

    ```
    # To run the unit tests and generate a coverage report
    npm run test:cov

    # To run the end-to-end test(s)
    npm run test:e2e
    ```

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

