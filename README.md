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

Authorization for making changes in Canvas using the application is managed using
the [Canvas OAuth workflow](https://canvas.instructure.com/doc/api/file.oauth.html)
and scoped tokens. As such, you will also need to create an API Developer Key (see the Canvas documentation
[here](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-add-a-developer-key-for-an-account/ta-p/259)).
The "Redirect URI" must be the protocol and domain of the application, plus `/canvas/returnFromOAuth`.
The list of API scopes to specify are in flux. Refer to `ccm_web/server/src/canvas/canvas.scopes.ts` for details
on the latest expected scopes. Once the API Developer Key is created, you will need to collect
the associated client ID and secret and specify them in the `.env` configuration file.

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

3. Access the client by launching the tool from a Canvas course in your browser of choice.

Use `^C` to stop the container and `docker-compose down` to remove the last used image from staging.

Many TypeScript and static file changes can be made without re-building the image,
but as necessary, rebuild the image using Step 1.

#### Step By Step

Explicit steps for setting up CCM in a development environment.

##### Start local ngrok server

1. Start an ngrok instance for the application, which will run on port 4000.
   `ngrok http 4000`
2. Make note of the hostname of the ngrok instance for use later.  The hostname may be found in the console output or it can be obtained from the ngrok API.  For example, if `jq` is installed, use the command:
   `curl --silent http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'`
   ***Note:*** Get only the hostname, not the `http`/`https` scheme prefix.

##### Create LTI configuration file

3. Create an LTI key JSON file, based on the sample provided.
   `cp config/lti_dev_key_sample.json lti_dev_key.json`
4. Edit the new `lti_dev_key.json` file to add or replace settings from the sample.  Replace all occurrences of `{ccm_app_hostname}` with the ngrok hostname copied in the earlier step.

##### Configure Canvas LTI key

5. Go to Canvas "Developer Keys" management page available from the "Admin" page for your account.  Click the button for "+ Developer Key", then "+ LTI Key".
6. When the "Key Settings" modal appears, select "Paste JSON" from the "Method" menu in the "Configure" section.  Then copy the contents of `config/lti_dev_key.json` and paste it into the "LTI 1.3 Configuration" field.
7. *Recommended:* Enter a name for the application in the "Key Name" field and an email address in the "Owner Email" field.
8. Click the "Save" button.
9. *Optional:* LTI Key, use "Manual Entry" under the "Method" menu to access "LTI Advantage Services" under the "Configuration" section.  Enable all options, then click the "Save" button.

    1. Note:  After saving, using "Paste JSON" under the "Method" menu, will show the corresponding JSON for the LTI Advantage configuration changes.  Enabling the LTI Advantage options adds them to the `scopes` key of the JSON.
10. Copy the ID number of the LTI key created in Canvas.  The ID is the long number shown in the "Details" column of the "Developer Keys" page.  It usually looks like "`17700000000000nnn`".
11. Click the "ON" part of the switch in the "State" column of your LTI key, so that it has a green background.

##### Configure Canvas API key

12. Go to Canvas "Developer Keys" management available from the "Admin" page for your account. Click the button for "+ Developer Key", then "+ API Key".
13. Enter a name in the "Key Name" field.  
    > 💡 The name of this key is used as the title and in the body of
    > the authorization dialog box shown to the user.  Be sure to pick
    > a meaningful name for this key.  For example, name it "Canvas
    > Course Manager", **_NOT_** "CCM API key".
14. In the "Redirect URIs" field, enter:
     `https://{ccm_app_hostname}/canvas/returnFromOAuth`
     Where `{ccm_app_hostname}` is the ngrok hostname copied earlier (in step 2).
     ***Note:*** Do ***NOT*** use the "Redirect URI (Legacy)" field.
15. Enable the "Enforce Scopes" option, then add all scopes needed by the application (i.e., those listed in `ccm_web/server/src/canvas/canvas.scopes.ts`).
16. Click the "Save" button.
17. Copy the ID number of the API key created in Canvas. The ID is the long number shown in the "Details" column of the "Developer Keys" page. It usually looks like "`17700000000000nnn`".
18. Click the "Show Key" button underneath the ID located in step 16, and copy the secret that appears in the dialog.
19. Click the "ON" part of the switch in the "State" column of your API key, so that it has a green background.

##### Configure Canvas API admin token

20. Refer to [API Token Generation for Applications (Service Account)](
    https://umich.instructure.com/courses/66037/pages/api-token-generation-for-applications-service-account)  
    to create a Canvas user with an account role that includes the   
    "Users - manage login details" permission.  That is the only permission  
    needed, so for the best security, create a role for only that one.  
21. Copy the static API key created in Canvas. The ID is the long number shown
    in the "Approved Integrations" section of the admin user's account "Settings" page. It usually begins
    with "1770~…".

##### Configure local environment

22. Make a `.env` file for the project, based on the sample provided.
     `cp config/.env.sample .env`
23. Edit the `.env` file.  The keys in the following list must/should be updated.

     1. `DOMAIN` – Hostname of the server hosting the CCM application.
        For local development purposes with ngrok, use the hostname
        copied during step 2.
     2. Verify the `LTI_PLATFORM_URL` variable value is correct for the instance of Canvas used.
     3. Add to the `LTI_CLIENT_ID` variable value the LTI key ID number copied earlier (in step 10).
     4. `CANVAS_INSTANCE_URL` – For U-M development/testing, this should
        be `https://canvas-test.it.umich.edu`.  Note that this is the URL
        that would be used by the user to access Canvas.  It may be 
        different from the value of the `LTI_PLATFORM_URL` key.
     5. Add to the `CANVAS_API_CLIENT_ID` variable value the API key copied earlier (in step 17).
     6. Add to the `CANVAS_API_SECRET` variable value the secret copied earlier (in step 18).
     7. Add to the `CANVAS_ADMIN_API_TOKEN` key the API token copied earlier  
        (in step 21).
     8. Configure invitation API settings.  The invitation API used by CCM is
        currently based on [Cirrus Identity services](https://www.cirrusidentity.com/).  Provide values for each
        of the following keys:
        1. `INVITATION_API_KEY`
        2. `INVITATION_API_SECRET`
        3. `INVITATION_API_ENTITY_ID`
        4. `INVITATION_API_SPONSOR_NAME` — Note that this is an email address,
           which Cirrus uses to identify the sponsor's name.
    
##### Build, start, and run application

24. Build and start the application with docker-compose.
     1. `docker-compose build`
     2. `docker-compose up`
25. Add the CCM LTI tool to a course.  
     1. Course home page → "Settings" → "Apps" tab → "View App Configurations" button.
         Alternatively, if working in the Canvas test environment, go to 
         (https://canvas-test.it.umich.edu/courses/nnnnnn/settings/configurations),
         where "nnnnnn" is the course ID.
     2. Click the "+App" button.
     3. In the "Configuration Type" menu, select "By Client ID".
     4. In the "Client ID" field, paste in the same ID number that was added to `LTI_CLIENT_ID` in the `.env` file above.
     5. When prompted to verify the ID for the tool, click the "Install" button.

#### Database Migrations

Database migrations are managed using [`umzug`](https://github.com/sequelize/umzug).
Umzug is a sister library to [`sequelize`](https://sequelize.org/) for migration tasks.
After creating/modifying a model using the Sequelize ORM,
you create a migration file and run the migration using `umzug`.
Developers have to write `up` and `down` migration steps manually.

1. Running migrations locally
    1. Run migrations: `docker exec -it ccm_web node -r ts-node/register server/src/migrator up`
    2. Revert a migration: `docker exec -it ccm_web node -r ts-node/register server/src/migrator down`.
    3. Create a migration file: `docker exec -it ccm_web node -r ts-node/register server/src/migrator create --name my-migration.ts`.

        This generates a migration file called `<timestamp>.my-migration.ts`.
        The timestamp prefix can be customized to be date-only or omitted,
        but be aware that it's strongly recommended to ensure your migrations are lexicographically sortable
        so it's easy for humans and tools to determine what order they should run in
        so the default prefix is recommended.

2. Running the migration are usually done when server is starting up, but in addition if you want to run migrations or revert use above commands

3. Running migrations `docker-compose-prod.yml`
    1. For running the migrations in in dev/test/prod, use `docker exec -it ccm_web_prod node server/src/migrator up` and `docker exec -it ccm_web_prod node server/src/migrator down`.
    2. The reason for the separate setups for running migrations for local/non-prod and prod is locally, we don't
    transpile TypeScript to Javascript and so we always use `ts-node/register` module for running in node
    environment.

#### Troubleshooting

1. ***Error:***
   
   ```txt
   ccm_web     | (node:64) UnhandledPromiseRejectionWarning: Error: An error occurred while setting up ltijs: Error: MISSING_PLATFORM_URL_OR_CLIENTID
   ccm_web     |     at /base/server/src/lti/lti.middleware.ts:22:15
   ccm_web     |     at processTicksAndRejections (internal/process/task_queues.js:93:5)
   ```
   
   This happens when the LTI key is not configured or configured improperly.
   ***Solution:***  Follow the steps documented above to ensure the key is configured correctly, then start the application again.
   
2. ***Error:***

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

### CCM Documentation
GitHub Pages is used for hosting the CCM feature documentation,
and files are placed and served from the `docs` directory.

#### Testing locally

In order to test documentation changes locally, follow the steps below:
1. Navigate to the `docs` directory.
    ```
    cd docs
    ```
2. Start up the documentation testing server with Docker:
    ```
    docker compose -f docker-compose-gh-pages.yml up`
    ```
3. Navigate to `http://locahost:4020` in your browser.
Recent changes to files will be automatically deployed; the changes will be displayed after a browser refresh.
    
GitHub follows Jekyll structure for deploying.
See [here](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)
for more info.

#### Deploying to GitHub Pages

To deploy the latest changes to the GitHub Pages site, follow the steps below:
1. Go to the CCM repository, then click "Settings" and then "Pages".
2. Choose the branch to deploy from, and then specify the `docs` folder.
3. Click "Save", which will begin a deployment. (It will take a few seconds, and only 10 builds are allowed per hour.)
4. Once the site has been published, navigate to `https://{your_account}.github.io/canvas-course-manager-next`,
replacing `{your_account}` with your GitHub user or organization name, to view the content.

See [here](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll) for more info about this process.

#### Running unit tests

The backend application includes some unit and end-to-end tests built using Nest tooling
as well as [Jest](https://jestjs.io/) and [Supertest](https://github.com/visionmedia/supertest).
To run the test suites, do the following:

1. Start up the application using the steps above, and then in a separate terminal window,
enter the container using `docker exec`.

    ```
    docker exec -it ccm_web /bin/bash
    ```

2. Run one of a handful of test commands defined in `package.json` under `scripts`.

    ```
    # To run the unit tests and generate a coverage report
    npm run test:cov
    
    # To run the end-to-end test(s)
    npm run test:e2e
    ```

#### Nest CLI

The Nest framework comes with a [command-line interface tool](https://docs.nestjs.com/cli/overview)
for generating module and other code stubs and performing other tasks.
As the necessary libraries are not included in `package.json`, follow the documentation's suggestion
and install `@nestjs/cli` globally on your machine if you want to use the tool.

#### Using OpenAPI and Swagger

When in development mode (i.e. the `NODE_ENV` environment variable's value is `development`),
the application generates [OpenAPI](https://www.openapis.org/) documentation and an explorer for
the API endpoints using a [Nest](https://docs.nestjs.com/openapi/introduction) package and
[Swagger](https://swagger.io/).

To access and use the Swagger UI, launch the application from a course in Canvas,
then click on the "Swagger UI" link in the application interface's footer.
This will take you to the Swagger page where you can view the documented API endpoints.
Requests can also be made against the API using the "Try it out" functionality.

However, to execute `PUT` and `POST` requests using Swagger, you will need to provide a CSRF token
(`GET` requests do not need this token).
The current CSRF token is currently made available as a URL parameter called `csrfToken`,
which you can see and copy by using a browser tool to view the frame's source.
Once the token is obtained, in the Swagger UI, click the "Authorize" button, paste the token in the popup field,
and then click "Authorize" to complete the process.
Subsequent requests made using the Swagger UI to routes requiring the CSRF token
will include the value you provided in the proper header.

### Production

Taken together, all the stages in `ccm_web/Dockerfile` will build an optimized image for production.

You can test the Docker production image and other production code branches by using `docker-compose-prod.yml`.
To do so, issue the same commands as above under **Development**
with the `-f` flag specifying `docker-compose-prod.yml`.
The file uses the same `.env` configuration file, so adjust any values there as needed
(see **Configuration** above for more info).
Note that, at minimum, the database host needs to be changed to `ccm_db_prod`
(since that is the name of the container).

The repository also includes a `ccm_web/Dockerfile.openshift` file that is used
for OpenShift deployments. It combines the "base" and "build" stages of the other
`Dockerfile` and pulls base images from the OpenShift namespace, which are not subject
to Docker Hub pull limits.

### Notice(s) regarding external code used

This repository contains modified portions of the npm package
[@types/ltijs](https://www.npmjs.com/package/@types/ltijs), which carries an MIT license.
See `ccm_web/server/localTypes/ltijs/index.d.ts` for more information and the modified code.
This code will hopefully only remain in this repository temporarily.

## GitHub Action
1. The [GitHub action](https://docs.github.com/en/actions/quickstart) configuration in [/.github/workflows/ccm.yml](../.github/workflows/ccm.yml) uses Dockerfile to build the app, then pushes the image to the [GitHub container registry (GHCR)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
2. The action is triggered whenever a commit is made to the `main` branch.  E.g., when a pull request is merged to `main`.
3. OpenShift projects can periodically pull this image from GHCR.  Configure only **_NON-PRODUCTION_** CCM projects to pull the image…
    ```sh
    oc tag ghcr.io/tl-its-umich-edu/canvas-course-manager-next:latest canvas-course-manager-next:latest --scheduled --reference-policy=local
    ```
    See the OpenShift documentation "[Managing image streams: Configuring periodic importing of image stream tags](https://docs.openshift.com/container-platform/4.11/openshift_images/image-streams-manage.html#images-imagestream-import_image-streams-managing)" for details.

    `reference-policy=local` : If you want to instruct OpenShift Container Platform to always fetch the tagged image from the [integrated registry](https://docs.openshift.com/container-platform/4.11/openshift_images/managing_images/tagging-images.html#images-add-tags-to-imagestreams_tagging-images)

