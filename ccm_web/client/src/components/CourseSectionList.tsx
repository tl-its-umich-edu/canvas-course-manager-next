import { useSnackbar } from 'notistack'
import { styled } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'
import {
  Backdrop,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material'

import APIErrorMessage from './APIErrorMessage.js'
import { getCourseSections, unmergeSections } from '../api.js'
import usePromise from '../hooks/usePromise.js'
import {
  CanvasCourseSection, CanvasCourseSectionBase, injectCourseName, CanvasCourseSectionWithCourseName
} from '../models/canvas.js'
import { CCMComponentProps } from '../models/FeatureUIData.js'

const PREFIX = 'CourseSectionList'

const classes = {
  secondaryTypography: `${PREFIX}-secondaryTypography`,
  overflowEllipsis: `${PREFIX}-overflowEllipsis`,
  header: `${PREFIX}-header`,
  listItem: `${PREFIX}-listItem`,
  backdrop: `${PREFIX}-backdrop`,
  listContainer: `${PREFIX}-listContainer`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.secondaryTypography}`]: {
    display: 'inline'
  },

  [`& .${classes.overflowEllipsis}`]: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  },

  [`& .${classes.header}`]: {
    backgroundColor: '#F8F8F8'
  },

  [`& .${classes.listItem}`]: {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#EEEEEE',
    marginBottom: '2px'
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
  },

  [`& .${classes.listContainer}`]: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    minHeight: '400px'
  }
}))

export interface CourseSectionListProps extends CCMComponentProps {
  canUnmerge: boolean
}

function CourseSectionList (props: CourseSectionListProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()

  const [sections, setSections] = useState<CanvasCourseSectionWithCourseName[]>([])
  const [loadSections, isLoading, error] = usePromise(
    async () => await getCourseSections(props.course.id),
    (sections: CanvasCourseSection[]) => {
      setSections(injectCourseName(sections, props.course.name))
    }
  )

  const [sectionsToUnmerge, setSectionsToUnmerge] = useState<CanvasCourseSection[]>([])
  const [doUnmerge, isUnmerging, unmergeError] = usePromise(
    async () => await unmergeSections(sectionsToUnmerge, props.csrfToken.token),
    (unmergedSections: CanvasCourseSectionBase[]) => {
      setSections(sections.filter(section => { return !unmergedSections.map(s => { return s.id }).includes(section.id) }))
      setSectionsToUnmerge([])
    }
  )
  useEffect(() => {
    if (sectionsToUnmerge.length > 0) {
      void doUnmerge()
    }
  }, [sectionsToUnmerge])

  useEffect(() => {
    if (unmergeError !== undefined) {
      enqueueSnackbar(<APIErrorMessage context='unmerging sections' error={unmergeError} />, { variant: 'error' })
    }
  }, [unmergeError])

  useEffect(() => {
    void loadSections()
  }, [])

  useEffect(() => {
    if (error !== undefined) {
      enqueueSnackbar(<APIErrorMessage context='loading section data' error={error} />, { variant: 'error' })
    }
  }, [error])

  const loadingText = (): string => {
    return isLoading ? 'Loading...' : 'Unmerging...'
  }

  const loading = (): JSX.Element => {
    return (<Backdrop className={classes.backdrop} open={isLoading || isUnmerging}>
      <Grid container>
        <Grid item xs={12}>
          <CircularProgress color="inherit" />
        </Grid>
        <Grid item xs={12}>
          {loadingText()}
        </Grid>
      </Grid>
    </Backdrop>)
  }

  const unmergeSection = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, section: CanvasCourseSection): React.MouseEventHandler<HTMLButtonElement> | undefined => {
    e.stopPropagation()
    setSectionsToUnmerge([section])
    return undefined
  }

  const unmergeButton = (section: CanvasCourseSection): JSX.Element => {
    if (section.nonxlist_course_id !== null && props.canUnmerge) {
      return (<Button color='primary' variant='contained' disabled={isUnmerging} onClick={(e) => unmergeSection(e, section)}>Unmerge</Button>)
    } else {
      return (<></>)
    }
  }

  const listItemText = (section: CanvasCourseSectionWithCourseName): JSX.Element => {
    return (
      <ListItemText primary={section.name}
        secondary={
          <React.Fragment>
            <Typography
              component="span"
              variant="body2"
              className={classes.secondaryTypography}
              color="textPrimary"
            >
              <span className={classes.overflowEllipsis}>{section.course_name}</span>
            </Typography>
            {unmergeButton(section)}
            <span style={{ float: 'right' }}>
              {`${section.total_students ?? '?'} students`}
            </span>
          </React.Fragment>
      }>
      </ListItemText>
    )
  }

  const sectionList = (): JSX.Element => {
    return (
      <Root>
        <Typography variant='h6' component='h2'>Course Sections</Typography>
        <div className={classes.listContainer}>
          <List>
            {sections.map(section => {
              return (
              <ListItem key={section.id} className={classes.listItem}>
                {listItemText(section)}
              </ListItem>
              )
            })}
          </List>
          {loading()}
        </div>
      </Root>
    )
  }

  return (sectionList())
}

export default CourseSectionList
