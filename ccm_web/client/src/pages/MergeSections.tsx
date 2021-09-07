import React, { useEffect, useState } from 'react'

import { Backdrop, Button, CircularProgress, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import { Error as ErrorIcon } from '@material-ui/icons'

import { CCMComponentProps } from '../models/FeatureUIData'
import { mergeSectionProps } from '../models/feature'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import { CanvasCourseSection } from '../models/canvas'
import { getCourseSections } from '../api'
import usePromise from '../hooks/usePromise'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
  },
  selectSections: {
    // flexGrow: 1
    // width: '100%'
  },
  sectionSelectionContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
  },
  sectionLoadErrorIcon: {
    color: '#3F648E'
  },
  sectionLoadError: {
    textAlign: 'center'
  }
}))

enum PageState {
  SelectSections = 0
}

function MergeSections (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const [pageState, setPageState] = useState<PageState>(PageState.SelectSections)

  const [unstagedSections, setUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [stagedSections, setStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const [selectedUnstagedSections, setSelectedUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [selectedStagedSections, setSelectedStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const updateUnstagedSections = (sections: CanvasCourseSection[]): void => {
    setUnstagedSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }).map(s => { return { ...s, locked: false } }))
  }

  const [doLoadUnstagedSectionData, isUnstagedSectionsLoading, loadUnstagedSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateUnstagedSections(sections)
    }
  )

  const updateStagedSections = (sections: CanvasCourseSection[]): void => {
    setStagedSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }).map(s => { return { ...s, locked: true } }))
  }

  const [doLoadStagedSectionData, isStagedSectionsLoading, loadStagedSectionsError] = usePromise(
    async () => await Promise.resolve([{ id: 0, name: 'Fake Section', total_students: 123 }]),
    (sections: CanvasCourseSection[]) => {
      updateStagedSections(sections)
    }
  )

  useEffect(() => {
    void doLoadUnstagedSectionData()
    void doLoadStagedSectionData()
  }, [])

  const renderComponent = (): JSX.Element => {
    switch (pageState) {
      case PageState.SelectSections:
        return getSelectSections()
      default:
        return <div>?</div>
    }
  }

  const stageSections = (): void => {
    setStagedSections(stagedSections.concat(selectedUnstagedSections.map(s => { return { ...s, locked: false } })))
    setUnstagedSections(unstagedSections.filter(s => { return !selectedUnstagedSections.includes(s) }))
  }

  const getSelectSectionsUnstaged = (): JSX.Element => {
    if (loadUnstagedSectionsError === undefined) {
      return (
        <>
          <div>
            <Button variant="contained" color="primary" onClick={stageSections} disabled={selectedUnstagedSections.length === 0}>
              Add
            </Button>
            <SectionSelectorWidget height={400} title={'Sections I teach'} search={'None'} multiSelect={true} sections={unstagedSections !== undefined ? unstagedSections : []} selectedSections={selectedUnstagedSections} selectionUpdated={setSelectedUnstagedSections}></SectionSelectorWidget>
            <Backdrop className={classes.backdrop} open={isUnstagedSectionsLoading}>
              <Grid container>
                <Grid item xs={12}>
                  <CircularProgress color="inherit" />
                </Grid>
                <Grid item xs={12}>
                  Loading sections
                </Grid>
              </Grid>
            </Backdrop>
          </div>
        </>
      )
    } else {
      return (
        <Paper className={classes.sectionLoadError} role='alert'>
          <Typography>Error loading sections</Typography>
          <ErrorIcon className={classes.sectionLoadErrorIcon} fontSize='large'/>
        </Paper>
      )
    }
  }

  const getSelectSectionsStaged = (): JSX.Element => {
    if (loadStagedSectionsError === undefined) {
      return (
        <>
          <div>
            <SectionSelectorWidget height={400} search={'None'} multiSelect={true} sections={stagedSections !== undefined ? stagedSections : []} selectedSections={selectedStagedSections} selectionUpdated={setSelectedStagedSections}></SectionSelectorWidget>
            <Backdrop className={classes.backdrop} open={isStagedSectionsLoading}>
              <Grid container>
                <Grid item xs={12}>
                  <CircularProgress color="inherit" />
                </Grid>
                <Grid item xs={12}>
                  Loading sections
                </Grid>
              </Grid>
            </Backdrop>
          </div>
        </>
      )
    } else {
      return (
        <Paper className={classes.sectionLoadError} role='alert'>
          <Typography>Error loading sections</Typography>
          <ErrorIcon className={classes.sectionLoadErrorIcon} fontSize='large'/>
        </Paper>
      )
    }
  }

  const getSelectSections = (): JSX.Element => {
    return (
      <>
        <Grid className={classes.sectionSelectionContainer} container spacing={5}>
          <Grid item xs={12} sm={6}>
            {getSelectSectionsUnstaged()}
          </Grid>
          <Grid item xs={12} sm={6}>
            {getSelectSectionsStaged()}
          </Grid>
        </Grid>

      </>
    )
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>{mergeSectionProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export default MergeSections
