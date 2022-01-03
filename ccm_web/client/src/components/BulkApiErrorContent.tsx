import React from 'react'
import { Typography } from '@material-ui/core'

import CanvasAPIErrorsTable from './CanvasAPIErrorsTable'
import CSVFileName from './CSVFileName'
import ErrorAlert from './ErrorAlert'
import RowLevelErrorsContent from './RowLevelErrorsContent'
import { CanvasError } from '../utils/handleErrors'

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
            table={<CanvasAPIErrorsTable errors={error.errors} />}
            title='Some errors occurred'
            message={<Typography>Some of your entries received errors when being added to Canvas.</Typography>}
            resetUpload={tryAgain}
          />
          </>
        )
      : <ErrorAlert messages={[apiErrorMessage]} tryAgain={tryAgain} />
  )
}
