import React from 'react'
import { Box, Grid, makeStyles, Typography } from '@material-ui/core'

import ErrorAlert from './ErrorAlert'

const useStyles = makeStyles((theme) => ({
  padding: {
    padding: theme.spacing(1)
  }
}))

interface RowLevelErrorsContentProps {
  table: JSX.Element
  title: string
  resetUpload: () => void
  message?: JSX.Element
}

function RowLevelErrorsContent (props: RowLevelErrorsContentProps): JSX.Element {
  const classes = useStyles()
  const defaultMessage = <Typography>Create a new file with corrected versions of these rows.</Typography>

  return (
    <Grid container justify='flex-start'>
      <Box clone order={{ xs: 2, sm: 1 }}>
        <Grid item xs={12} sm={8} className={classes.padding}>{props.table}</Grid>
      </Box>
      <Box clone order={{ xs: 1, sm: 2 }}>
        <Grid item xs={12} sm={4}>
          <ErrorAlert
            title={props.title}
            messages={[props.message !== undefined ? props.message : defaultMessage]}
            tryAgain={props.resetUpload}
            embedded={true}
          />
        </Grid>
      </Box>
    </Grid>
  )
}

export default RowLevelErrorsContent
