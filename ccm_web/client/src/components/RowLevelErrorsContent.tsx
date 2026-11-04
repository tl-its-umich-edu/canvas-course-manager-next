import { styled } from '@mui/material/styles'
import { Grid, Typography } from '@mui/material'

import ErrorAlert from './ErrorAlert.js'

import type { JSX } from 'react'

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
    <StyledGrid container sx={{ justifyContent: 'flex-start' }}>
      <Grid
        sx={{ order: { xs: 2, sm: 1 } }}
        className={classes.padding}
        size={{
          xs: 12,
          sm: 8
        }}>{props.table}</Grid>
      <Grid
        sx={{ order: { xs: 1, sm: 2 } }}
        size={{
          xs: 12,
          sm: 4
        }}>
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
