import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, Grid, GridSize, InputLabel, List, ListItem, ListItemText, makeStyles, Menu, MenuItem, Select, TextField, Typography, useMediaQuery, useTheme } from '@material-ui/core'
// import { ClearIcon, SortIcon } from '@material-ui/icons'
import ClearIcon from '@material-ui/icons/Clear'
import SortIcon from '@material-ui/icons/Sort'
import React, { useEffect, useState } from 'react'
import { CanvasCourseSection, ICanvasCourseSectionSort } from '../models/canvas'
import { ISectionSearcher } from '../pages/MergeSections'

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
  search: 'None' | 'Hidden' | ISectionSearcher[]
  showCourseName?: boolean
  action?: {text: string, cb: () => void, disabled: boolean}
  header?: {
    title: string
    sort?: { sorters: Array<{ func: ICanvasCourseSectionSort, text: string}>, sortChanged: (currentSort: ICanvasCourseSectionSort) => void }
  }
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()

  const [sectionFilterText, setSectionFilterText] = useState<string>('')
  const [filteredSections, setFilteredSections] = useState<SelectableCanvasCourseSection[]>(props.sections)

  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean>(false)

  const [anchorSortEl, setAnchorSortEl] = React.useState<null | HTMLElement>(null)

  const [searcher, setSearcher] = React.useState<ISectionSearcher | undefined>(props.search !== 'Hidden' && props.search !== 'None' ? (props.search)[0] : undefined)
  const [searchTextFieldLabel, setSearchTextFieldLabel] = React.useState<string | undefined>(props.search !== 'Hidden' && props.search !== 'None' ? `Search By ${(props.search)[0].name}` : undefined)

  useEffect(() => {
    if (sectionFilterText.length === 0) {
      setFilteredSections(props.sections)
    } else {
      setFilteredSections(props.sections.filter(p => { return p.name.toUpperCase().includes(sectionFilterText.toUpperCase()) }))
    }
  }, [sectionFilterText, props.sections])

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
        newSelections.push(filteredSections.filter(s => { return s.id === sectionId })[0])
      } else {
        newSelections = [filteredSections.filter(s => { return s.id === sectionId })[0]]
      }
    }

    props.selectionUpdated(newSelections)
  }

  const isSectionSelected = (sectionId: number): boolean => {
    return props.selectedSections.map(s => { return s.id }).includes(sectionId)
  }

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (searcher === undefined) {
      setSectionFilterText(event.target.value)
    } else {
      setSectionFilterText(event.target.value)
      searcher.search(event.target.value)
    }
  }

  const clearSearch = (): void => {
    setSectionFilterText('')
  }

  // TODO Debounce
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>): void => {
    const sort = event.target.value as string
    setSearcher((props.search as ISectionSearcher[]).filter(searcher => { return searcher.name === sort })[0])
    setSearchTextFieldLabel(`Search by ${sort}`)
  }

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
          {(props.search as ISectionSearcher[]).map((searcher, index) => {
            return <MenuItem key={index} value={searcher.name}>{searcher.name}</MenuItem>
          })}
        </Select>
      </FormControl>
    )
  }

  const getSearchTextFieldEndAdornment = (hasText: boolean): JSX.Element => {
    if (!hasText && props.search !== 'Hidden' && props.search !== 'None') {
      return (getSearchTypeAdornment())
    } else {
      return (<ClearIcon onClick={clearSearch}/>)
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
    setFilteredSections(sorter.sort(filteredSections))
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
        <Button style={{ float: 'left' }} aria-controls="simple-menu" aria-haspopup="true" onClick={handleSortMenuClick} disabled={filteredSections.length < 2}>
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
          <Grid item container className={classes.searchContainer} style={props.search === 'None' ? { display: 'none' } : props.search === 'Hidden' ? { visibility: 'hidden' } : {}} xs={12}>
            <TextField className={classes.searchTextField} onChange={searchChange} value={sectionFilterText} id='textField_Search' size='small' label={searchTextFieldLabel} variant='outlined' InputProps={{ endAdornment: getSearchTextFieldEndAdornment(sectionFilterText.length > 0) }}/>
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
      <Grid item xs={12}>
        <List className={classes.listContainer} style={{ maxHeight: props.height }}>
          {filteredSections.map((section, index) => {
            return (<ListItem divider key={section.id} button disabled={section.locked} selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
              {listItemText(section)}
            </ListItem>)
          })}
        </List>
      </Grid>
    </Grid>
    </>
  )
}

export default SectionSelectorWidget
