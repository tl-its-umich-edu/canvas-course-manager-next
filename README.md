## Canvas Course Manager

### Overview

The application is primarily written in [TypeScript](https://www.typescriptlang.org/)
and makes use of the [React framework](https://reactjs.org/) for the client and
the [Django framework](https://www.djangoproject.com/) for the backend.

### Configuration

#### Application

Configuration for the project is currently managed using environment variables.
Docker handles the setting of key-value pairs in `docker-compose.yml`,
through the `environment` block and by consuming a `.env` file.
Docker will expect to find a `.env` file at the ${HOME}/secrets/ccm/.env directory.

This repository includes in the `config` directory a `.env.sample` template file for `.env`,
with the expected keys provided. Comments above each key describe what the value is used for,
and in some cases, indicate that the key-value pair is optional.


### Development

#### Installation and usage

Once you have fully configured the application (see the **Configuration** section above),
you can use the following steps to build and run the application using Docker.

1. Build a development image for the web application.
    ```
    docker compose build
    ```

2. Start up the server and webpack for development.
    ```
    docker compose up
    ```

3. Access the client by launching the tool from a Canvas course in your browser of choice.
4. Then the app in development should be accessible on http://localhost:4000/

Use `^C` to stop the container and `docker-compose down` to remove the last used image from staging.


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
    
GitHub follows Jekyll structure for deploying.
See [here](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)
for more info.

### LTI configuration


Explicit steps for setting up CCM in a development environment.

##### Start local ngrok server

1. Start an ngrok/loophole instance for the application, which will run on port 4000.
   `ngrok http 4000` or `loophole http 4000 --hostname=<your-hostname>
2. Make note of the hostname of the ngrok instance for use later.  The hostname may be found in the console output or it can be obtained from the ngrok API.  For example, if `jq` is installed, use the command:
   `curl --silent http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'`
   ***Note:*** Get only the hostname, not the `http`/`https` scheme prefix.

##### Create LTI configuration file

3. Create an LTI key JSON file, based on the sample provided.
   `cp config/lti_dev_key_sample.json lti_dev_key.json`
4. Edit the new `lti_dev_key.json` file to add or replace settings from the sample.  Replace all occurrences of `{ccm_app_hostname}` with the ngrok/loophole hostname copied in the earlier step.
5. Also in `lti_dev_key.json` replace `<uuid>` with 1233.

##### Configure Canvas LTI key

6. Go to Canvas "Developer Keys" management page available from the "Admin" page for your account.  Click the button for "+ Developer Key", then "+ LTI Key".
7. When the "Key Settings" modal appears, select "Paste JSON" from the "Method" menu in the "Configure" section.  Then copy the contents of `config/lti_dev_key.json` and paste it into the "LTI 1.3 Configuration" field.
8. *Recommended:* Enter a name for the application in the "Key Name" field and an email address in the "Owner Email" field.
9. Click the "Save" button. This will create a new LTI Registration with client_id. `Copy the client_id`
10. Go To the `Settings` option from the Admin page --> Apps --> VIew App Configuration --> +App --> Choose Configuration type `By Client_id` --> Paste the client_id from Step 8
11. Copy the Deployment_id by searching for the LTI tool you just added to the Canvas, Click setting button next it and right `click copy 'Deployment Id'`
12. Run this command `docker exec -it ccm_web python manage.py rotate_keys`. This will create the Private and Public key for LTI
13. Managing LTI registration to Tool: The LTI registration is completely handled from the Django Admin Console, so we need `UUID` from LTI Tool and `Client_id` and `Deployment_id` from the Canvas. So the Commandline option will help you in various use cases to set up LTI registration.  Please note *Issuer* and *Auth domain names* are different. For example, configuration in Canvas Test takes these values: `issuer=canvas.test.instructure.com` then `Auth URL=sso.test.canvaslms.com`. More [info](https://canvas.instructure.com/doc/api/file.lti_launch_overview.html).
    1. Creating new LTI registration. This will generate  UUID now go to your Tool Canvas LTI Registration and copy this UUID in OpenID Connect Initiation Url after /init/ inplace of /1233/
    ```sh 
    docker exec -it ccm_web python manage.py manage_lti_key --action=create --client_id=<client_id> --deployment_id=<deployment_id> --name=<name-given-in-tool>
    ```
       
    2. Incase of Canvas Prod sync wiped out your LTI tool configuration but you still have existing LTI configuration in you local Database and just simply want to update the client_id and deployment_id follow the steps Step 3-10 get Client_id and Deployment_id and after use the command below to update based the LTI registration id in the table `lti_tool_ltiregistration`
     ```sh
     docker exec -it ccm_web python manage.py manage_lti_key --action=update --client_id=17700000000000200 --id=18 --deployment_id=1233:12334
     ```
      where id=18 is the Database Id in the table `lti_tool_ltiregistration` where you want to update client_id.
    3. Simply want to get the UUID based on the client_id 
    ```sh 
    docker exec -it ccm_web python manage.py manage_lti_key --action=get --client_id=17700000000000200
    ```
    UUID is stored in the Database looks like and alpha numeric number without dashes, but LTI tool expects UUID with dashes. This is slight detail you can't simply copy/paste the UUID from Database.
14. The CommandLine option might be only once during the Non-prod Deployment but for locally development you might repeat. 
15. The app has redis caching and `ccm_redis` container should we running with `docker compose up`. To test if redis connection is working
    ```sh
        docker exec -it ccm_web /code/manage.py shell
        #the above command open a command prompt and type below statement and it should return test_value
        from django.core.cache import cache; cache.set('test_key', 'test_value', timeout=60);cache.get('test_key')
    ```
16. Grant yourself admin access by updating the `auth_user` table and setting `is_staff` to 1. Optionally, you can also set `is_superuser` to 1. Currently, only enabling the `is_staff` permission will grant access to the Admin console.

#### UnitTesting
All test cases are going in the `tests` folder and run it as below
`docker exec -it ccm_web python manage.py test`
Testing usecases from on file
`docker exec -it ccm_web python manage.py test backend.tests.<name-of-file-without-dotpy>`
#### Deploying to GitHub Pages

To deploy the latest changes to the GitHub Pages site, follow the steps below:
1. Go to the CCM repository, then click "Settings" and then "Pages".
2. Choose the branch to deploy from, and then specify the `docs` folder.
3. Click "Save", which will begin a deployment. (It will take a few seconds, and only 10 builds are allowed per hour.)
4. Once the site has been published, navigate to `https://{your_account}.github.io/canvas-course-manager-next`,
replacing `{your_account}` with your GitHub user or organization name, to view the content.

See [here](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll) for more info about this process.


## GitHub Action
1. The [GitHub action](https://docs.github.com/en/actions/quickstart) configuration in [/.github/workflows/ccm.yml](../.github/workflows/ccm.yml) uses Dockerfile to build the app, then pushes the image to the [GitHub container registry (GHCR)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
2. The action is triggered whenever a commit is made to the `main` branch.  E.g., when a pull request is merged to `main`.
3. OpenShift projects can periodically pull this image from GHCR.  Configure only **_NON-PRODUCTION_** CCM projects to pull the image…
    ```sh
    oc tag ghcr.io/tl-its-umich-edu/canvas-course-manager-next:main canvas-course-manager-next:main --scheduled --reference-policy=local
    ```
    See the OpenShift documentation "[Managing image streams: Configuring periodic importing of image stream tags](https://docs.openshift.com/container-platform/4.11/openshift_images/image-streams-manage.html#images-imagestream-import_image-streams-managing)" for details.

    `reference-policy=local` : If you want to instruct OpenShift Container Platform to always fetch the tagged image from the [integrated registry](https://docs.openshift.com/container-platform/4.11/openshift_images/managing_images/tagging-images.html#images-add-tags-to-imagestreams_tagging-images)

