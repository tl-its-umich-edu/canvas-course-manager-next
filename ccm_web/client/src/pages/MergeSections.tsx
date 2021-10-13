import React, { useEffect, useState } from 'react'

import { Button, Grid, LinearProgress, makeStyles, Typography } from '@material-ui/core'

import { useSnackbar } from 'notistack'

import { CCMComponentProps } from '../models/FeatureUIData'
import { mergeSectionProps } from '../models/feature'
import SectionSelectorWidget, { SelectableCanvasCourseSection } from '../components/SectionSelectorWidget'
import { CanvasCourseSection, CanvasCourseSectionSort_AZ, CanvasCourseSectionSort_UserCount, CanvasCourseSectionSort_ZA, ICanvasCourseSectionSort } from '../models/canvas'
import { mergeSections } from '../api'
import usePromise from '../hooks/usePromise'
import { RoleEnum } from '../models/models'
import { CourseNameSearcher, CourseSectionSearcher, SectionNameSearcher, UniqnameSearcher } from '../utils/SectionSearcher'
import CourseSectionList from '../components/CourseSectionList'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left',
    '& button': {
      margin: 5
    }
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
  submitButton: {
    float: 'right'
  }
}))

enum PageState {
  SelectSections = 0,
  Merging = 1,
  Merged = 2
}

export interface ISectionSearcher {
  name: string
  helperText: string
  preload: string | undefined
  search: (searchString: string) => Promise<void>
  updateTitleCallback?: (title: string) => void
  init: () => Promise<void>
  resetTitle?: () => void
  isInteractive: boolean
}

// TODO for dev testing remove all this before merging
// Can set to a specific role for testing purposes
const OVERRIDE_ROLE: RoleEnum | undefined = undefined // RoleEnum.Teacher

function MergeSections (props: CCMComponentProps): JSX.Element {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [pageState, setPageState] = useState<PageState>(PageState.SelectSections)

  // Updating untagedSections is done via setUnsyncedUnstagedSections so that the synchornizing of unstaged/staged sections can be done in useEffect
  const [unsyncedUnstagedSections, setUnsyncedUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  // setUnstagedSections should only be called from the effect on unsyncedUnstagedSections. Maybe this is a way to hide this
  const [unstagedSections, setUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [stagedSections, setStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const [selectedUnstagedSections, setSelectedUnstagedSections] = useState<SelectableCanvasCourseSection[]>([])
  const [selectedStagedSections, setSelectedStagedSections] = useState<SelectableCanvasCourseSection[]>([])

  const [unstagedSectionsSort, setUnstagedSectionsSort] = useState<ICanvasCourseSectionSort>(new CanvasCourseSectionSort_AZ())

  const [sectionsTitle, setSectionsTitle] = useState('Sections I Teach')

  useEffect(() => {
    setUnstagedSections(
      unstagedSectionsSort.sort(unsyncedUnstagedSections.map(s => { return { ...s, locked: stagedSections.filter(staged => { return staged.id === s.id }).length > 0 } })))
  }, [unsyncedUnstagedSections])

  const stagedSectionsSorter = new CanvasCourseSectionSort_AZ()
  const updateStagedSections = (sections: CanvasCourseSection[]): void => {
    setStagedSections(stagedSectionsSorter.sort(sections).map(s => { return { ...s, locked: true } }))
  }

  const mergableSections = (): SelectableCanvasCourseSection[] => {
    return stagedSections.filter(section => { return !(section.locked ?? false) })
  }

  const [doMerge, isMerging, mergeError] = usePromise(
    async () => await mergeSections(props.globals.course.id, mergableSections())
  )

  useEffect(() => {
    if (mergeError !== undefined) {
      enqueueSnackbar('Error merging', {
        variant: 'error'
      })
    }
  }, [mergeError])

  useEffect(() => {
    if (!isMerging) {
      if (pageState === PageState.Merging) {
        setPageState(PageState.Merged)
      }
    }
  }, [isMerging])

  const getMerging = (): JSX.Element => {
    return (
      <div style={{ paddingTop: '20px', minHeight: '400px', textAlign: 'center' }}>
        <Grid container>
          <Grid item xs={12}>
            Merging sections...
          </Grid>
          <Grid item xs={12} style={{ paddingTop: '20px' }}>
            <LinearProgress />
          </Grid>
        </Grid>
      </div>
    )
  }

  const renderComponent = (): JSX.Element => {
    switch (pageState) {
      case PageState.SelectSections:
        return getSelectSections()
      case PageState.Merging:
        return getMerging()
      case PageState.Merged:
        return getMergeSuccess()
      default:
        return <div>?</div>
    }
  }

  // const isTeacher = (): boolean => {
  //   if (OVERRIDE_ROLE !== undefined) {
  //     return OVERRIDE_ROLE === RoleEnum.Teacher
  //   }
  //   return props.globals.course.roles.includes(RoleEnum.Teacher)
  // }

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
    setStagedSections(selectedUnstagedSections.concat(stagedSections))
    setUnsyncedUnstagedSections(unstagedSections)
    setSelectedUnstagedSections([])
  }

  const unStageSections = (): void => {
    setUnsyncedUnstagedSections(unstagedSections)
    setStagedSections(stagedSections.filter(s => { return !selectedStagedSections.includes(s) }))
    setSelectedStagedSections([])
  }

  const getSelectSectionsUnstaged = (): JSX.Element => {
    return (
      <>
        <div>
          <SectionSelectorWidget
            action={{ text: 'Add', cb: stageSections, disabled: selectedUnstagedSections.length === 0 }}
            height={400}
            header={{
              title: sectionsTitle,
              sort: {
                sortChanged: setUnstagedSectionsSort,
                sorters: [
                  { func: new CanvasCourseSectionSort_UserCount(), text: '# of students' },
                  { func: new CanvasCourseSectionSort_AZ(), text: 'A-Z' },
                  { func: new CanvasCourseSectionSort_ZA(), text: 'Z-A' }
                ]
              }
            }}
            search={ isSubAccountAdmin() || isAccountAdmin() ? [new CourseNameSearcher(props.termId, props.globals.course.id, setUnsyncedUnstagedSections, setSectionsTitle), new UniqnameSearcher(props.termId, props.globals.course.id, setUnsyncedUnstagedSections, setSectionsTitle)] : [new SectionNameSearcher(props.termId, props.globals.course.id, setUnsyncedUnstagedSections, setSectionsTitle)]}
            multiSelect={true}
            showCourseName={true}
            sections={unstagedSections !== undefined ? unstagedSections : []}
            selectedSections={selectedUnstagedSections}
            selectionUpdated={setSelectedUnstagedSections}
            canUnmerge={false}></SectionSelectorWidget>
        </div>
      </>
    )
  }

  const handleUnmergedSections = (unmergedSections: SelectableCanvasCourseSection[]): void => {
    setStagedSections(stagedSections.filter(section => { return !unmergedSections.map(us => { return us.id }).includes(section.id) }))
  }

  const getSelectSectionsStaged = (): JSX.Element => {
    return (
      <div>
        <SectionSelectorWidget
          action={{ text: 'Undo', cb: unStageSections, disabled: selectedStagedSections.length === 0 }}
          height={400}
          header={{ title: 'Prepared to merge' }}
          search={ [new CourseSectionSearcher(props.termId, props.globals.course.id, updateStagedSections, undefined)] }
          multiSelect={true}
          showCourseName={true}
          sections={stagedSections !== undefined ? stagedSections : []}
          selectedSections={selectedStagedSections}
          selectionUpdated={setSelectedStagedSections}
          sectionsRemoved={handleUnmergedSections}
          canUnmerge={isSubAccountAdmin() || isAccountAdmin()}
          highlightUnlocked={true}
          ></SectionSelectorWidget>
      </div>
    )
  }

  const submit = (): void => {
    setPageState(PageState.Merging)
    void doMerge()
  }

  const canMerge = (): boolean => {
    return stagedSections.filter(s => { return !(s.locked ?? false) }).length > 0
  }

  const mergeButtonText = (sectionsToMerge: SelectableCanvasCourseSection[]): string => {
    return `Go Merge ${sectionsToMerge.length > 0 ? '(' + String(sectionsToMerge.length) + ')' : ''}`
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
        <Button className={classes.submitButton} onClick={submit} variant='contained' color='primary' disabled={!canMerge()}>{mergeButtonText(mergableSections())}</Button>
      </>
    )
  }

  const getMergeSuccess = (): JSX.Element => {
    return (<CourseSectionList canUnmerge={isAccountAdmin() || isSubAccountAdmin()} courseId={props.globals.course.id}/>)
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5' component='h1'>{mergeSectionProps.title}</Typography>
      {renderComponent()}
    </div>
  )
}

export default MergeSections
