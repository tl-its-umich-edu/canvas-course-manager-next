import styled from '@emotion/styled'
import { Typography } from '@mui/material'
import { CanvasCourseSectionWithCourseName } from '../models/canvas.js'

const PREFIX = 'SelectedSectionInfo'

const classes = {
  sectionInfoContainer: `${PREFIX}-sectionInfoContainer`
}

const Root = styled('div')(() => ({
  [`&.${classes.sectionInfoContainer}`]: {
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'left'
  }
}))

interface SelectedSectionInfoProps {
  section: CanvasCourseSectionWithCourseName
}

export default function SelectedSectionInfo (props: SelectedSectionInfoProps): JSX.Element {
  const { section } = props

  return (
    <Root className={classes.sectionInfoContainer}>
      <Typography>
        <strong>Section selected: </strong>
        {section.name} (ID: {section.id})
      </Typography>
    </Root>
  )
}
