import React, { useEffect, useState } from 'react'

import { Backdrop, Button, CircularProgress, Grid, makeStyles, Paper, Typography } from '@material-ui/core'
import { Error as ErrorIcon } from '@material-ui/icons'

import { CCMComponentProps } from '../models/FeatureUIData'
import { mergeSectionProps } from '../models/feature'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import { CanvasCourseSection, CanvasCourseSectionSort_AZ, CanvasCourseSectionSort_UserCount, CanvasCourseSectionSort_ZA, ICanvasCourseSectionSort } from '../models/canvas'
import { getCourseSections, getMergedSections } from '../api'
import usePromise from '../hooks/usePromise'
import { RoleEnum } from '../models/models'
import { CourseNameSearcher, SectionNameSearcher, UniqnameSearcher } from '../utils/SectionSearcher'

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
    textAlign: 'center',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#EEEEEE'
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
  },
  submitButton: {
    float: 'right'
  }
}))

enum PageState {
  SelectSections = 0
}

export interface ISectionSearcher {
  name: string
  preload: string | undefined
  search: (searchString: string) => Promise<void>
}

// TODO for dev testing remove
const OVERRIDE_ROLE: RoleEnum | undefined = RoleEnum.Teacher

function MergeSections (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const [pageState, setPageState] = useState<PageState>(PageState.SelectSections)

  const [unstagedSections, setUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [stagedSections, setStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const [selectedUnstagedSections, setSelectedUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [selectedStagedSections, setSelectedStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const [unstagedSectionsSort, setUnstagedSectionsSort] = useState<ICanvasCourseSectionSort>(new CanvasCourseSectionSort_AZ())

  const updateUnstagedSections = (sections: CanvasCourseSection[]): void => {
    setUnstagedSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }).map(s => { return { ...s, locked: false } }))
  }

  const [doLoadUnstagedSectionData, isUnstagedSectionsLoading, loadUnstagedSectionsError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      // TODO Some temp stuff in here to populate course names -- get rid of the map
      updateUnstagedSections(sections.map(s => { return { ...s, course_name: 'Course ' + Array(Math.floor(Math.random() * (128 - 8 + 1) + 8)).fill('x').join('') } }))
    }
  )

  const updateStagedSections = (sections: CanvasCourseSection[]): void => {
    setStagedSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }).map(s => { return { ...s, locked: true } }))
  }

  const [doLoadStagedSectionData, isStagedSectionsLoading, loadStagedSectionsError] = usePromise(
    async () => await getMergedSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateStagedSections(sections)
    }
  )

  useEffect(() => {
    if (!isAccountAdmin() && !isSubAccountAdmin()) {
      void doLoadUnstagedSectionData()
    }
  }, [])

  useEffect(() => {
    void doLoadStagedSectionData()
    console.log(JSON.stringify(props.globals))
  }, [])

  const renderComponent = (): JSX.Element => {
    switch (pageState) {
      case PageState.SelectSections:
        return getSelectSections()
      default:
        return <div>?</div>
    }
  }

  const isTeacher = (): boolean => {
    if (OVERRIDE_ROLE !== undefined) {
      return OVERRIDE_ROLE === RoleEnum.Teacher
    }
    return props.globals.course.roles.includes(RoleEnum.Teacher)
  }

  const isSubAccountAdmin = (): boolean => {
    if (OVERRIDE_ROLE !== undefined) {
      return OVERRIDE_ROLE === RoleEnum['Subaccount admin']
    }
    return props.globals.course.roles.includes(RoleEnum['Subaccount admin'])
  }

  const isAccountAdmin = (): boolean => {
    if (OVERRIDE_ROLE !== undefined) {
      return OVERRIDE_ROLE === RoleEnum['Account Admin']
    }
    return props.globals.course.roles.includes(RoleEnum['Account Admin'])
  }

  const stageSections = (): void => {
    setStagedSections(stagedSections.concat(selectedUnstagedSections))
    setUnstagedSections(unstagedSectionsSort.sort(unstagedSections.filter(s => { return !selectedUnstagedSections.includes(s) })))
    setSelectedUnstagedSections([])
  }

  const unStageSections = (): void => {
    console.debug(unstagedSectionsSort.description)
    setUnstagedSections(unstagedSectionsSort.sort(unstagedSections.concat(selectedStagedSections)))
    setStagedSections(stagedSections.filter(s => { return !selectedStagedSections.includes(s) }))
    setSelectedStagedSections([])
  }

  const getSelectSectionsUnstaged = (): JSX.Element => {
    if (loadUnstagedSectionsError === undefined) {
      return (
        <>
          <div>
            <SectionSelectorWidget
              action={{ text: 'Add', cb: stageSections, disabled: selectedUnstagedSections.length === 0 }}
              height={400}
              header={{
                title: 'Sections I teach',
                sort: {
                  sortChanged: setUnstagedSectionsSort,
                  sorters: [
                    { func: new CanvasCourseSectionSort_UserCount(), text: '# of students' },
                    { func: new CanvasCourseSectionSort_AZ(), text: 'A-Z' },
                    { func: new CanvasCourseSectionSort_ZA(), text: 'Z-A' }
                  ]
                }
              }}
              search={ isSubAccountAdmin() || isAccountAdmin() ? [new CourseNameSearcher(props.globals.course.id, setUnstagedSections), new UniqnameSearcher(props.globals.course.id, setUnstagedSections)] : [new SectionNameSearcher(props.globals.course.id, setUnstagedSections)]}
              multiSelect={true}
              showCourseName={true}
              sections={unstagedSections !== undefined ? unstagedSections : []}
              selectedSections={selectedUnstagedSections}
              selectionUpdated={setSelectedUnstagedSections}></SectionSelectorWidget>
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
            <SectionSelectorWidget
              action={{ text: 'Undo', cb: unStageSections, disabled: selectedStagedSections.length === 0 }}
              height={400}
              header={{ title: 'Prepared to merge' }}
              search={ [] }
              multiSelect={true}
              showCourseName={true}
              sections={stagedSections !== undefined ? stagedSections : []}
              selectedSections={selectedStagedSections}
              selectionUpdated={setSelectedStagedSections}></SectionSelectorWidget>
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
          <Typography>Error loading merged sections</Typography>
          <ErrorIcon className={classes.sectionLoadErrorIcon} fontSize='large'/>
        </Paper>
      )
    }
  }

  const submit = (): void => {
    console.log('Submit')
  }

  const canMerge = (): boolean => {
    return stagedSections.filter(s => { return !(s.locked ?? false) }).length > 0
  }

  const getSelectSections = (): JSX.Element => {
    return (
      <>
        <Grid container spacing={5} style={{ marginBottom: '0px', marginTop: '0px' }}>
          <Grid className={classes.sectionSelectionContainer} item xs={12} sm={6}>
            {getSelectSectionsUnstaged()}
          </Grid>
          <Grid className={classes.sectionSelectionContainer} item xs={12} sm={6}>
            {getSelectSectionsStaged()}
          </Grid>
        </Grid>
        <Button className={classes.submitButton} onClick={submit} variant='contained' color='primary' disabled={!canMerge()}>Go Merge</Button>
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
