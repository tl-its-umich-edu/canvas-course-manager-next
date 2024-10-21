import React from 'react'
import { styled } from '@mui/material/styles'
import { Grid, Typography } from '@mui/material'

import ErrorAlert from './ErrorAlert.js'

const PREFIX = 'RowLevelErrorsContent'

const classes = {
  padding: `${PREFIX}-padding`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`& .${classes.padding}`]: {
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
  const defaultMessage = <Typography>Create a new file with corrected versions of these rows.</Typography>

  return (
    <StyledGrid container justifyContent='flex-start'>
        <Grid item xs={12} sm={8} sx={{ order: { xs: 2, sm: 1 } }} className={classes.padding}>{props.table}</Grid>
        <Grid item xs={12} sm={4} sx={{ order: { xs: 1, sm: 2 } }}>
          <ErrorAlert
            title={props.title}
            messages={[props.message !== undefined ? props.message : defaultMessage]}
            tryAgain={props.resetUpload}
            embedded={true}
          />
        </Grid>
    </StyledGrid>
  )
}

export default RowLevelErrorsContent
