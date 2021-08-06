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
        curl 'https://canvas-test.it.umich.edu/api/v1/sections/543762/enrollments' \
        --data-raw 'enrollment[user_id]=384537&enrollment[type]=StudentEnrollment&enrollment[notify]=false'
        ```

* My test environment
    * Course ID  
      
          374350
    * Section ID ("Section One")  
      
          543762
    * User ID ("loginId" for "canvas a test")  
      
          384537
    * Type  

          StudentEnrollment

Weird log results:

```txt
ccm_web     | 2021-08-06T16:48:17.091Z - api.enroll.section.users.handler.ts - debug - Sending request to Canvas endpoint: "accounts/1/users"; queryParams: "{"search_term":"studenta@umich.edu"}"
ccm_web     | 2021-08-06T16:48:22.734Z - api.enroll.section.users.handler.ts - debug - Received response with status code 200
ccm_web     | 2021-08-06T16:48:22.735Z - api.utils.ts - error - An error occurred while making a request to Canvas: {}
ccm_web     | 2021-08-06T16:48:22.735Z - api.utils.ts - error - An error occurred while making a request to Canvas: {"statusCode":500,"errors":[{"canvasStatusCode":500,"message":"A non-HTTP error occurred while communicating with Canvas.","failedInput":null}]}
ccm_web     | 2021-08-06T16:48:22.735Z - api.enroll.section.users.handler.ts - debug - Time elapsed to enroll (1) users: (5) seconds
```
