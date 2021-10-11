import { Backdrop, Button, CircularProgress, Grid, List, ListItem, ListItemText, makeStyles, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { getCourseSections, unmergeSections } from '../api'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection, CanvasCourseSectionBase } from '../models/canvas'
import { useSnackbar } from 'notistack'

const useStyles = makeStyles((theme) => ({
  secondaryTypography: {
    display: 'inline'
  },
  overflowEllipsis: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  },
  header: {
    backgroundColor: '#F8F8F8'
  },
  listItem: {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#EEEEEE',
    marginBottom: '2px'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
  },
  listContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    minHeight: '400px'
  }
}))

export interface CourseSectionListProps {
  canUnmerge: boolean
  courseId: number
}

function CourseSectionList (props: CourseSectionListProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()
  const [sections, setSections] = useState<CanvasCourseSection[]>([])
  const [loadSections, isLoading, error] = usePromise(
    async () => await getCourseSections(props.courseId),
    (sections: CanvasCourseSection[]) => {
      setSections(sections)
    }
  )

  const [sectionsToUnmerge, setSectionsToUnmerge] = React.useState<CanvasCourseSection[]>([])
  const [doUnmerge, isUnmerging, unmergeError] = usePromise(
    async () => await unmergeSections(sectionsToUnmerge),
    (unmergedSections: CanvasCourseSectionBase[]) => {
      setSections(sections.filter(section => { return !unmergedSections.map(s => { return s.id }).includes(section.id) }))
      console.log('unmerged')
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
      enqueueSnackbar('Error unmerging', {
        variant: 'error'
      })
    }
  }, [unmergeError])

  useEffect(() => {
    void loadSections()
  }, [])

  useEffect(() => {
    if (error !== undefined) {
      enqueueSnackbar('Error loading sections', {
        variant: 'error'
      })
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
    console.log(`unmerge section ${section.id}`)
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

  const listItemText = (section: CanvasCourseSection): JSX.Element => {
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
      <div>
        <Typography variant='h6'>Course Sections</Typography>
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
      </div>
    )
  }

  return (sectionList())
}

export default CourseSectionList
