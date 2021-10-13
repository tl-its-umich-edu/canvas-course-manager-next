import { Backdrop, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormGroup, Grid, GridSize, InputLabel, List, ListItem, ListItemText, makeStyles, Menu, MenuItem, Select, TextField, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { useDebounce } from '@react-hook/debounce'
import ClearIcon from '@material-ui/icons/Clear'
import SortIcon from '@material-ui/icons/Sort'
import React, { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'

import { CanvasCourseSection, ICanvasCourseSectionSort } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'
import usePromise from '../hooks/usePromise'
import { unmergeSections } from '../api'

const useStyles = makeStyles((theme) => ({
  listContainer: {
    overflow: 'auto',
    marginBottom: '5px',
    '&& .Mui-disabled': {
      opacity: 1,
      '& > .MuiListItemAvatar-root': {
        opacity: theme.palette.action.disabledOpacity
      },
      '& > .MuiListItemText-root': {
        '& > :not(.MuiListItemText-secondary)': {
          opacity: theme.palette.action.disabledOpacity
        },
        '& .MuiListItemText-secondary': {
          '& > Button': {
            pointerEvents: 'auto'
          }
        }
      }
    }
  },
  searchContainer: {
    textAlign: 'left'
  },
  searchTextField: {
    width: '100%'
  },
  title: {
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'column'
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: '0'
  },
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
  searchEndAdnornment: {
    width: '200px'
  },
  sectionSelectionContainer: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#EEEEEE',
    minHeight: '100px'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
  },
  highlighted: {
    borderLeftStyle: 'solid',
    borderLeftColor: '#3777c5',
    borderLeftWidth: '1px'
  }
}))

export interface SelectableCanvasCourseSection extends CanvasCourseSection {
  locked?: boolean
}

interface ISectionSelectorWidgetProps {
  sections: SelectableCanvasCourseSection[]
  selectedSections: SelectableCanvasCourseSection[]
  height: number
  multiSelect: boolean
  selectionUpdated: (sections: SelectableCanvasCourseSection[]) => void
  search: ISectionSearcher[]
  showCourseName?: boolean
  action?: {text: string, cb: () => void, disabled: boolean}
  header?: {
    title: string
    sort?: { sorters: Array<{ func: ICanvasCourseSectionSort, text: string}>, sortChanged: (currentSort: ICanvasCourseSectionSort) => void }
  }
  canUnmerge: boolean
  sectionsRemoved?: (sections: SelectableCanvasCourseSection[]) => void
  highlightUnlocked?: boolean
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()

  // The search text ultimately used when searching
  const [sectionSearcherText, setSectionSearcherText] = useState<string | undefined>(undefined)
  // The text actually displayed in the search field
  const [searchFieldText, setSearchFieldText] = useState<string>('')
  // The debounced version of the text in the search field
  // Changes here will be passed along to sectionSearcherText
  const [searchFieldTextDebounced, setSearchFieldTextDebounced] = useDebounce<string | undefined>(undefined, 750)
  const [internalSections, setInternalSections] = useState<SelectableCanvasCourseSection[]>(props.sections)

  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean>(false)

  const [anchorSortEl, setAnchorSortEl] = useState<null | HTMLElement>(null)

  const [searcher, setSearcher] = useState<ISectionSearcher | undefined>(props.search.length > 0 ? (props.search)[0] : undefined)
  const [searchFieldLabel, setSearchFieldLabel] = useState<string | undefined>(props.search.length > 0 ? (props.search)[0].helperText : undefined)

  const [sectionsToUnmerge, setSectionsToUnmerge] = useState<CanvasCourseSection[]>([])
  const [doUnmerge, isUnmerging, unmergeError] = usePromise(
    async () => await unmergeSections(sectionsToUnmerge)
  )

  useEffect(() => {
    if (sectionsToUnmerge.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      doUnmerge().then(() => {
        setInternalSections(internalSections.filter(section => { return !sectionsToUnmerge.map(s2u => { return s2u.id }).includes(section.id) }))
        if (props.sectionsRemoved !== undefined) {
          props.sectionsRemoved(sectionsToUnmerge)
        }
        setSectionsToUnmerge([])
      })
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
    if (searcher?.resetTitle !== undefined) searcher.resetTitle()
  }, [searcher])

  useEffect(() => {
    setInternalSections(props.sections)
    setIsSelectAllChecked(selectableSections().length > 0 && props.selectedSections.length === selectableSections().length)
  }, [props.sections])

  useEffect(() => {
    void init()
  }, [])

  const selectableSections = (): SelectableCanvasCourseSection[] => {
    const s = props.sections.filter(s => { return !(s.locked ?? false) })
    return s
  }

  useEffect(() => {
    setIsSelectAllChecked(selectableSections().length > 0 && props.selectedSections.length === selectableSections().length)
  }, [props.selectedSections])

  const handleListItemClick = (
    sectionId: number
  ): void => {
    let newSelections = [...props.selectedSections]
    const alreadySelected = props.selectedSections.filter(s => { return s.id === sectionId })
    if (alreadySelected.length > 0) {
      newSelections.splice(newSelections.indexOf(alreadySelected[0]), 1)
    } else {
      if (props.multiSelect) {
        newSelections.push(internalSections.filter(s => { return s.id === sectionId })[0])
      } else {
        newSelections = [internalSections.filter(s => { return s.id === sectionId })[0]]
      }
    }

    props.selectionUpdated(newSelections)
  }

  const isSectionSelected = (sectionId: number): boolean => {
    return props.selectedSections.map(s => { return s.id }).includes(sectionId)
  }

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchFieldText(event.target.value)
    setSearchFieldTextDebounced(event.target.value)
  }

  const useFirstRender = (): boolean => {
    const firstRender = React.useRef(true)
    useEffect(() => {
      firstRender.current = false
    }, [])
    return firstRender.current
  }

  const firstRender = useFirstRender()

  useEffect(() => {
    if (!firstRender && (sectionSearcherText === undefined || sectionSearcherText?.length >= 3)) {
      void search()
    }
  }, [sectionSearcherText])

  useEffect(() => {
    if (!firstRender) {
      setSectionSearcherText(searchFieldTextDebounced)
    }
  }, [searchFieldTextDebounced])

  const clearSearch = (): void => {
    props.selectionUpdated([])
    setSearchFieldText('')
    setSearchFieldTextDebounced(undefined)
    setSectionSearcherText(undefined)
    if (searcher?.resetTitle !== undefined) searcher.resetTitle()
  }

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
    const sort = event.target.value as string
    const newSearcher = (props.search).filter(searcher => { return searcher.name === sort })[0]
    setSearcher(newSearcher)
    setSearchFieldLabel(newSearcher.helperText)
  }

  const [search, isSearching, searchError] = usePromise(async () => {
    if (searcher !== undefined) {
      props.selectionUpdated([])
      if (sectionSearcherText !== undefined) {
        await searcher.search(sectionSearcherText)
      } else {
        await searcher.init()
      }
    }
    return null
  }
  )

  const [init, isIniting, initError] = usePromise(async () => {
    if (searcher !== undefined) {
      await searcher.init()
    }
  })

  useEffect(() => {
    if (searchError !== undefined || initError !== undefined) {
      enqueueSnackbar('Error searching sections', {
        variant: 'error'
      })
    }
  }, [searchError, initError])

  const getSearchTypeAdornment = (): JSX.Element => {
    return (
      <FormControl className={classes.searchEndAdnornment}>
      <InputLabel id="demo-simple-select-label">Search By</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={searcher?.name}
        onChange={handleChange}
      >
        {(props.search).map((searcher, index) => {
          return <MenuItem key={index} value={searcher.name}>{searcher.name}</MenuItem>
        })}
      </Select>
    </FormControl>
    )
  }

  const getSearchTextFieldEndAdornment = (hasText: boolean): JSX.Element => {
    if (!hasText && props.search.length > 1) {
      return (getSearchTypeAdornment())
    } else if (searchFieldText.length > 0) {
      return (<ClearIcon onClick={clearSearch}/>)
    } else {
      return (<></>)
    }
  }

  const handleSelectAllClicked = (): void => {
    setIsSelectAllChecked(!isSelectAllChecked)
    props.selectionUpdated(!isSelectAllChecked ? props.sections.filter(s => { return !(s.locked ?? false) }) : [])
  }

  const unmergeSection = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, section: SelectableCanvasCourseSection): React.MouseEventHandler<HTMLButtonElement> | undefined => {
    e.stopPropagation()
    setSectionsToUnmerge([section])
    return undefined
  }

  const unmergeButton = (section: SelectableCanvasCourseSection): JSX.Element | undefined => {
    if (section.nonxlist_course_id !== null && props.canUnmerge && (section.locked ?? false)) {
      return <Button color='primary' variant='contained' disabled={isUnmerging} onClick={(e) => unmergeSection(e, section)}>Unmerge</Button>
    }
  }

  const listItemText = (section: SelectableCanvasCourseSection): JSX.Element => {
    const isSelected = isSectionSelected(section.id)
    if (props.showCourseName ?? false) {
      return (
        <ListItemText primary={section.name} style={isSelected ? { color: '#3777c5' } : { }}
          secondary={
            <React.Fragment>
              <Typography
                component="span"
                variant="body2"
                className={classes.secondaryTypography}
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
    } else {
      return (
        <ListItemText primary={section.name} secondary={`${section.total_students ?? '?'} students`}></ListItemText>
      )
    }
  }

  const actionButton = (): JSX.Element => {
    if (props.action === undefined) {
      return (<></>)
    } else {
      return (
      <Grid item xs={getColumns('action', 'xs')} sm={getColumns('action', 'sm')} md={getColumns('action', 'md')}>
        <Button style={{ float: 'right' }} variant="contained" color="primary" onClick={props.action.cb} disabled={props.action.disabled}>
          {props.action?.text}
        </Button>
      </Grid>
      )
    }
  }

  const handleSortMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorSortEl(event.currentTarget)
  }

  const handleSort = (event: React.MouseEvent<HTMLElement>, sorter: ICanvasCourseSectionSort): void => {
    setAnchorSortEl(null)
    props.header?.sort?.sortChanged(sorter)
    setInternalSections(sorter.sort(internalSections))
  }

  const handleSortMenuClose = (): void => {
    setAnchorSortEl(null)
  }

  /*
 Use Cases
  Add UM Users
    No header items
  Merge
    Instructor View
      Title, Select All, Sort
    Sub Account Admin
      Search ( Course Name )
      Title, Select All, Sort
    Service Center
      Search ( Course Name, Uniqname )
      Title, Select All, Sort
*/

  const getColumns = (item: 'title'|'select all'|'sort'|'action', size: 'xs'|'sm'|'md'): GridSize => {
    const hasSort = props.header?.sort !== undefined
    switch (item) {
      case 'title':
        if (size === 'xs') {
          return 12
        } else if (size === 'sm') {
          return 8
        } else {
          return hasSort ? 4 : 6
        }
      case 'select all':
        if (size === 'xs') {
          return 4
        } else if (size === 'sm') {
          return 4
        } else {
          return 3
        }
      case 'sort':
        if (size === 'xs') {
          return 4
        } else if (size === 'sm') {
          return 6
        } else {
          return 2
        }
      case 'action':
        if (size === 'xs') {
          return 4
        } else if (size === 'sm') {
          return hasSort ? 6 : 12
        } else {
          return 3
        }
      default:
        return 12
    }
  }

  const sortButton = (): JSX.Element => {
    if (props.header?.sort !== undefined && props.header.sort?.sorters.length > 0) {
      return (
        <Grid item xs={getColumns('sort', 'xs')} sm={getColumns('sort', 'sm')} md={getColumns('sort', 'md')}>
        <Button style={{ float: 'left' }} aria-controls="simple-menu" aria-haspopup="true" onClick={handleSortMenuClick} disabled={internalSections.length < 2}>
          <SortIcon/>Sort
        </Button>
        <Menu
          id="simple-menu"
          anchorEl={anchorSortEl}
          keepMounted
          open={Boolean(anchorSortEl)}
          onClose={handleSortMenuClose}
        >
          {props.header?.sort?.sorters.map((sort, index) => {
            return (<MenuItem key={index} onClick={(e) => { handleSort(e, sort.func) }}>{sort.text}</MenuItem>)
          })}
        </Menu>
      </Grid>
      )
    } else {
      return (<></>)
    }
  }

  const checkboxStyle = (): Record<string, unknown> => {
    const theme = useTheme()
    const xs = useMediaQuery(theme.breakpoints.up('xs'))
    return {
      visibility: props.multiSelect ? 'visible' : 'hidden',
      float: xs ? 'left' : 'right'
    }
  }

  // TODO display:none, visibility:hidden.. find a better way
  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <span aria-live='polite' aria-atomic='true' className={classes.srOnly}>{props.selectedSections.length} section{props.selectedSections.length === 1 ? '' : 's' } selected</span>
      <Grid container>
        <Grid className={classes.header} container item xs={12}>
          <Grid item container className={classes.searchContainer} style={props.search.length === 0 || (searcher !== undefined && !searcher.isInteractive) ? { display: 'none' } : {}} xs={12}>
            <TextField className={classes.searchTextField} disabled={isSearching || isIniting} onChange={searchChange} value={searchFieldText} id='textField_Search' size='small' label={searchFieldLabel} variant='outlined' inputProps={{ maxLength: 256 }} InputProps={{ endAdornment: getSearchTextFieldEndAdornment(searchFieldText.length > 0) }}/>
          </Grid>
          <Grid item container style={{ paddingLeft: '16px' }}>
            <Grid item xs={getColumns('title', 'xs')} sm={getColumns('title', 'sm')} md={getColumns('title', 'md')} className={classes.title}>
              <Typography variant='h6' style={{ visibility: props.header?.title !== undefined ? 'visible' : 'hidden' }}>{props.header?.title}
                <span hidden={props.selectedSections.length === 0}>
                  ({props.selectedSections.length})
                </span>
              </Typography>
            </Grid>
            <Grid item xs={getColumns('select all', 'xs')} sm={getColumns('select all', 'sm')} md={getColumns('select all', 'md')}>
              <FormGroup row style={checkboxStyle()}>
                <FormControlLabel
                control={
                    <Checkbox
                      checked={isSelectAllChecked}
                      onChange={handleSelectAllClicked}
                      name="selectAllUnstagedCB"
                      color="primary"
                    />
                  }
                  disabled={selectableSections().length === 0}
                  label="Select All"
                />
              </FormGroup>
            </Grid>
            {sortButton()}
            {actionButton()}
          </Grid>
        </Grid>
      <Grid item xs={12} className={classes.sectionSelectionContainer}>
        <List className={classes.listContainer} style={{ maxHeight: props.height }}>
          {internalSections.map((section, index) => {
            return (<ListItem divider key={section.id} button disabled={section.locked} selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)} className={ (section.locked !== true && props.highlightUnlocked === true) ? classes.highlighted : ''}>
              {listItemText(section)}
            </ListItem>)
          })}
        </List>
        <Backdrop className={classes.backdrop} open={isSearching || isIniting || isUnmerging}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color="inherit" />
            </Grid>
            <Grid item xs={12}>
              {isSearching ? 'Searching...' : 'Unmerging...'}
            </Grid>
          </Grid>
        </Backdrop>
      </Grid>
    </Grid>
    </>
  )
}

export default SectionSelectorWidget
