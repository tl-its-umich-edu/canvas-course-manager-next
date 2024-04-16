import React from 'react'
import { Typography } from '@mui/material'

import APIErrorsTable from './APIErrorsTable.js'
import CSVFileName from './CSVFileName.js'
import ErrorAlert from './ErrorAlert.js'
import RowLevelErrorsContent from './RowLevelErrorsContent.js'
import { CanvasError } from '../utils/handleErrors.js'

interface BulkApiErrorContentProps {
  error: Error
  file?: File
  tryAgain: () => void
}

export default function BulkApiErrorContent (props: BulkApiErrorContentProps): JSX.Element {
  const { error, file, tryAgain } = props
  const apiErrorMessage = (
    <Typography key={0}>The last action failed with the following message: {error.message}</Typography>
  )
  return (
    error instanceof CanvasError
      ? (
          <>
          {file !== undefined && <CSVFileName file={file} />}
          <RowLevelErrorsContent
            table={<APIErrorsTable errors={error.describeErrors()} />}
            title='Some errors occurred'
            message={<Typography>Some of your entries received errors when being added to Canvas.</Typography>}
            resetUpload={tryAgain}
          />
          </>
        )
      : <ErrorAlert messages={[apiErrorMessage]} tryAgain={tryAgain} />
  )
}
