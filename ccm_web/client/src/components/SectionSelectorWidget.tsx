import { Backdrop, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, FormGroup, Grid, GridSize, InputLabel, List, ListItem, ListItemText, makeStyles, Menu, MenuItem, Select, TextField, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { useDebounce } from '@react-hook/debounce'
import ClearIcon from '@material-ui/icons/Clear'
import SortIcon from '@material-ui/icons/Sort'
import React, { useEffect, useState } from 'react'
import { CanvasCourseSection, ICanvasCourseSectionSort } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'
import usePromise from '../hooks/usePromise'

const useStyles = makeStyles((theme) => ({
  listContainer: {
    overflow: 'auto',
    marginBottom: '5px'
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
    borderColor: '#EEEEEE'
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
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
  selectionUpdated: (section: SelectableCanvasCourseSection[]) => void
  search: ISectionSearcher[]
  showCourseName?: boolean
  action?: {text: string, cb: () => void, disabled: boolean}
  header?: {
    title: string
    sort?: { sorters: Array<{ func: ICanvasCourseSectionSort, text: string}>, sortChanged: (currentSort: ICanvasCourseSectionSort) => void }
  }
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()

  // The the search text ultimately used when searching
  const [sectionSearcherText, setSectionSearcherText] = useState<string | undefined>(undefined)
  // The text actually displayed in the search field
  const [searchFieldText, setSearchFieldText] = useState<string>('')
  // The debounced version of the text in the search field
  // Changes here will be passed along to sectionSearcherText
  const [searchFieldTextDebounced, setSearchFieldTextDebounced] = useDebounce<string | undefined>(undefined, 500)
  const [internalSections, setInternalSections] = useState<SelectableCanvasCourseSection[]>(props.sections)

  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean>(false)

  const [anchorSortEl, setAnchorSortEl] = React.useState<null | HTMLElement>(null)

  const [searcher, setSearcher] = React.useState<ISectionSearcher | undefined>(props.search.length > 0 ? (props.search)[0] : undefined)
  const [searchFieldLabel, setSearchFieldLabel] = React.useState<string | undefined>(props.search.length > 0 ? `Search By ${(props.search)[0].name}` : undefined)

  useEffect(() => {
    setInternalSections(props.sections)
  }, [props.sections])

  useEffect(() => {
    searcher?.init()
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
    if (!firstRender) {
      console.log(`Search because sectionSearcherText ${String(props.header?.title)} '${String(sectionSearcherText)}'`)
      void search()
    } else {
      console.log('Search skipped on first render')
    }
  }, [sectionSearcherText])

  useEffect(() => {
    if (!firstRender) {
      setSectionSearcherText(searchFieldTextDebounced)
    } else {
      console.log('sectionSearchTextDebounced update skipped on first render')
    }
  }, [searchFieldTextDebounced])

  const clearSearch = (): void => {
    props.selectionUpdated([])
    setSearchFieldText('')
    setSectionSearcherText(undefined)
  }

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
    const sort = event.target.value as string
    setSearcher((props.search).filter(searcher => { return searcher.name === sort })[0])
    setSearchFieldLabel(`Search by ${sort}`)
  }

  const [search, isSearching, searchError] = usePromise(async () => {
    if (searcher !== undefined) {
      props.selectionUpdated([])
      if (sectionSearcherText !== undefined) {
        console.log('search hook search')
        void searcher.search(sectionSearcherText)
      } else {
        console.log('search hook init')
        void searcher.init()
      }
    }
    return null
  }
  )

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

  const listItemText = (section: SelectableCanvasCourseSection): JSX.Element => {
    if (props.showCourseName ?? false) {
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
    console.debug('sort changed')
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

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <span aria-live='polite' aria-atomic='true' className={classes.srOnly}>{props.selectedSections.length} section{props.selectedSections.length === 1 ? '' : 's' } selected</span>
      <Grid container>
        <Grid className={classes.header} container item xs={12}>
          <Grid item container className={classes.searchContainer} style={props.search.length === 0 ? { display: 'none' } : {}} xs={12}>
            <TextField className={classes.searchTextField} disabled={isSearching} onChange={searchChange} value={searchFieldText} id='textField_Search' size='small' label={searchFieldLabel} variant='outlined' InputProps={{ endAdornment: getSearchTextFieldEndAdornment(searchFieldText.length > 0) }}/>
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
            return (<ListItem divider key={section.id} button disabled={section.locked} selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
              {listItemText(section)}
            </ListItem>)
          })}
        </List>
        <Backdrop className={classes.backdrop} open={isSearching}>
          <Grid container>
            <Grid item xs={12}>
              <CircularProgress color="inherit" />
            </Grid>
            <Grid item xs={12}>
              Searching...
            </Grid>
          </Grid>
        </Backdrop>
      </Grid>
    </Grid>
    </>
  )
}

export default SectionSelectorWidget
