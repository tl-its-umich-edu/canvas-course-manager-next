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
    
