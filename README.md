## Canvas Course Manager

Here are some basic set-up instructions. More details will be added later.

1. Build the web image.
    ```
    docker-compose build
    ```

2. Start up the `ccm_web` application container.
    ```
    docker-compose up
    ```

Use `^C` to stop the container and `docker-compose down` to remove the last used image from staging.

Many JavaScript and template changes can be made without re-building the image,
but as necessary, rebuild the image using Step 1.
