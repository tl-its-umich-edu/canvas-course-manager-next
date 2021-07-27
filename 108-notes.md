# lsloan_ccm — 108-notes

Notes for implementing issue #108.

* Canvas API
    * GET section enrollments  
        ```shell
        https://umich.instructure.com/api/v1/sections/544126/enrollments
        ```
      **_Caution_**: Results may include "Test Student" 
    * POST one section enrollment  
        ```shell
        curl 'https://umich.instructure.com/api/v1/sections/544126/enrollments' \
        --data-raw 'enrollment[user_id]=384537&enrollment[type]=StudentEnrollment'
        ```