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


## GitHub Action
1. The [GitHub action](https://docs.github.com/en/actions/quickstart) configuration in [/.github/workflows/ccm.yml](../.github/workflows/ccm.yml) uses Dockerfile to build the app, then pushes the image to the [GitHub container registry (GHCR)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
2. The action is triggered whenever a commit is made to the `main` branch.  E.g., when a pull request is merged to `main`.
3. OpenShift projects can periodically pull this image from GHCR.  Configure only **_NON-PRODUCTION_** CCM projects to pull the image…
    ```sh
    oc tag ghcr.io/tl-its-umich-edu/canvas-course-manager-next:main canvas-course-manager-next:main --scheduled --reference-policy=local
    ```
    See the OpenShift documentation "[Managing image streams: Configuring periodic importing of image stream tags](https://docs.openshift.com/container-platform/4.11/openshift_images/image-streams-manage.html#images-imagestream-import_image-streams-managing)" for details.

    `reference-policy=local` : If you want to instruct OpenShift Container Platform to always fetch the tagged image from the [integrated registry](https://docs.openshift.com/container-platform/4.11/openshift_images/managing_images/tagging-images.html#images-add-tags-to-imagestreams_tagging-images)

