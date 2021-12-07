import React from 'react'
import { makeStyles, Tooltip, Typography } from '@material-ui/core'
import HelpOutline from '@material-ui/icons/HelpOutline'

import CreateSectionWidget from './CreateSectionWidget'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from './SectionSelectorWidget'
import { CanvasCourseBase, CanvasCourseSection } from '../models/canvas'

const useStyles = makeStyles((theme) => ({
  createSectionWidget: {
    width: '500px'
  },
  sectionSelectionContainer: {
    textAlign: 'center',
    maxHeight: '400px'
  },
  newSectionHint: {
    display: 'flex'
  },
  tooltip: {
    marginLeft: theme.spacing(1)
  },
  createSectionContainer: {
    paddingBottom: theme.spacing(2)
  }
}))

interface CreateSelectSectionWidgetProps {
  course: CanvasCourseBase
  sections: SelectableCanvasCourseSection[]
  selectedSection?: SelectableCanvasCourseSection
  setSelectedSection: (section: SelectableCanvasCourseSection) => void
  onSectionCreated: (section: CanvasCourseSection) => void
}

export default function CreateSelectSectionWidget (props: CreateSelectSectionWidgetProps): JSX.Element {
  const classes = useStyles()
  return (
    <>
      <div className={classes.createSectionContainer}>
        <div className={classes.newSectionHint}>
          <Typography>Create a new section to add users</Typography>
          <Tooltip className={classes.tooltip} placement='top' title='Enter a distinct name for this section'>
            <HelpOutline fontSize='small'/>
          </Tooltip>
        </div>
        <div className={classes.createSectionWidget}>
          <CreateSectionWidget {...props} />
        </div>
      </div>
      <Typography variant='subtitle1'>Or select an existing section to add users to</Typography>
      <div className={classes.sectionSelectionContainer}>
        <SectionSelectorWidget
          height={300}
          search={[]}
          multiSelect={false}
          sections={props.sections}
          selectedSections={props.selectedSection !== undefined ? [props.selectedSection] : []}
          selectionUpdated={(sections) => props.setSelectedSection(sections[0])}
          canUnmerge={false}
        />
      </div>
    </>
  )
}
