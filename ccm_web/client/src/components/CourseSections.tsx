import { Button, List, ListItem, ListItemText, makeStyles, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { getCourseSections } from '../api'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection } from '../models/canvas'
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
  }
}))

export interface CourseSectionsProps {
  canUnmerge: boolean
  courseid: number
}

function CourseSections (props: CourseSectionsProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()
  const [sections, setSections] = useState<CanvasCourseSection[]>([])
  const [loadSections, isLoading, error] = usePromise(
    async () => await getCourseSections(props.courseid),
    (sections: CanvasCourseSection[]) => {
      setSections(sections)
    }
  )

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

  const loading = (): JSX.Element => {
    return (<div>Loading...</div>)
  }

  const unmergeButton = (section: CanvasCourseSection): JSX.Element => {
    if (section.nonxlist_course_id !== null && props.canUnmerge) {
      return <Button color='primary' variant='contained'>Unmerge</Button>
    } else {
      return <></>
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
    if (isLoading) {
      return loading()
    } else {
      return (
      <div>
        <Typography variant='h6'>Course Sections</Typography>
        <List>
          {sections.map(section => {
            return (
            <ListItem key={section.id} className={classes.listItem}>
              {listItemText(section)}
            </ListItem>
            )
          })}
        </List>
      </div>)
    }
  }

  return (sectionList())
}

export default CourseSections
