import React from 'react'
import { styled } from '@mui/material/styles'
import { Tooltip, Typography } from '@mui/material'
import { HelpOutline } from '@mui/icons-material'

import CreateSectionWidget from './CreateSectionWidget.js'
import SectionSelectorWidget from './SectionSelectorWidget.js'
import { CanvasCourseBase, CanvasCourseSection, CanvasCourseSectionWithCourseName } from '../models/canvas.js'

const PREFIX = 'CreateSelectSectionWidget'

const classes = {
  spacing: `${PREFIX}-spacing`,
  createSectionWidget: `${PREFIX}-createSectionWidget`,
  sectionSelectionContainer: `${PREFIX}-sectionSelectionContainer`,
  newSectionHint: `${PREFIX}-newSectionHint`,
  tooltip: `${PREFIX}-tooltip`,
  createSectionContainer: `${PREFIX}-createSectionContainer`
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.spacing}`]: {
    marginBottom: theme.spacing(2)
  },

  [`& .${classes.createSectionWidget}`]: {
    width: '500px'
  },

  [`& .${classes.sectionSelectionContainer}`]: {
    textAlign: 'center',
    maxHeight: '400px'
  },

  [`& .${classes.newSectionHint}`]: {
    display: 'flex'
  },

  [`& .${classes.tooltip}`]: {
    marginLeft: theme.spacing(1)
  },

  [`& .${classes.createSectionContainer}`]: {
    paddingBottom: theme.spacing(2)
  }
}))

interface WidgetWithoutCreateProps {
  readonly canCreate: false
  course?: never
  onSectionCreated?: never
}

interface WidgetWithCreateProps {
  readonly canCreate: true
  course: CanvasCourseBase
  onSectionCreated: (section: CanvasCourseSection) => void
}

export type CreateSelectSectionWidgetCreateProps = WidgetWithoutCreateProps | WidgetWithCreateProps

interface CreateSelectSectionWidgetBaseProps {
  sections: CanvasCourseSectionWithCourseName[]
  selectedSection?: CanvasCourseSectionWithCourseName
  setSelectedSection: (section: CanvasCourseSectionWithCourseName) => void
}

type CreateSelectSectionWidgetProps = CreateSelectSectionWidgetBaseProps & CreateSelectSectionWidgetCreateProps

export default function CreateSelectSectionWidget (props: CreateSelectSectionWidgetProps): JSX.Element {
  return (
    (<Root>
      {
        props.canCreate && (
          <div className={classes.createSectionContainer}>
            <div className={`${classes.newSectionHint} ${classes.spacing}`}>
              <Typography>Create a new section to add users to</Typography>
              <Tooltip className={classes.tooltip} placement='top' title='Enter a distinct name for this section'>
                <HelpOutline fontSize='small' />
              </Tooltip>
            </div>
            <div className={classes.createSectionWidget}>
              <CreateSectionWidget {...props} />
            </div>
          </div>
        )
      }
      <Typography variant='subtitle1' className={classes.spacing}>
        Select an existing section to add users to
      </Typography>
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
    </Root>)
  )
}
