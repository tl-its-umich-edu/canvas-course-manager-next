import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import { useSnackbar } from 'notistack'
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  GridSize,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { Clear as ClearIcon } from '@mui/icons-material'
import { Sort as SortIcon } from '@mui/icons-material'
import { useDebounce } from '@react-hook/debounce'

import APIErrorMessage from './APIErrorMessage.js'
import { unmergeSections } from '../api.js'
import usePromise from '../hooks/usePromise.js'
import { CanvasCourseSectionBase, CanvasCourseSectionWithCourseName, ICanvasCourseSectionSort } from '../models/canvas.js'
import { ISectionSearcher } from '../utils/SectionSearcher.js'
import { CsrfToken } from '../models/models.js'

const PREFIX = 'SectionSelectorWidget'

const classes = {
  listContainer: `${PREFIX}-listContainer`,
  listItemRoot: `${PREFIX}-listItemRoot`,
  listButton: `${PREFIX}-listButton`,
  listButtonFocusVisible: `${PREFIX}-listButtonFocusVisible`,
  searchContainer: `${PREFIX}-searchContainer`,
  searchTextField: `${PREFIX}-searchTextField`,
  title: `${PREFIX}-title`,
  srOnly: `${PREFIX}-srOnly`,
  secondaryTypography: `${PREFIX}-secondaryTypography`,
  overflowEllipsis: `${PREFIX}-overflowEllipsis`,
  header: `${PREFIX}-header`,
  searchEndAdnornment: `${PREFIX}-searchEndAdnornment`,
  sectionSelectionContainer: `${PREFIX}-sectionSelectionContainer`,
  backdrop: `${PREFIX}-backdrop`,
  highlighted: `${PREFIX}-highlighted`,
  button: `${PREFIX}-button`
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.listContainer}`]: {
    overflow: 'auto',
    marginBottom: '5px',
    '& .Mui-disabled': {
      opacity: 1,
      '& > .MuiListItemAvatar-root': {
        opacity: theme.palette.action.disabledOpacity
      },
      '& > .MuiListItemText-root': {
        '& > :not(.MuiListItemText-secondary)': {
          opacity: theme.palette.action.disabledOpacity
        }
      }
    }
  },

  [`& .${classes.listItemRoot}`]: {
    paddingTop: '0px',
    paddingBottom: '0px',
    paddingRight: '0px',
    display: 'block',
    '& > .MuiListItemSecondaryAction-root': {
      position: 'relative',
    },
  },

  [`& .${classes.listButton}`]: {
    width: '100%',
    height: '100%',
    textAlign: 'left',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },

  [`& .${classes.listButtonFocusVisible}`]: {
    backgroundColor: theme.palette.action.focus
  },

  [`& .${classes.searchContainer}`]: {
    textAlign: 'left'
  },

  [`& .${classes.searchTextField}`]: {
    width: '100%'
  },

  [`& .${classes.title}`]: {
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'column'
  },

  [`& .${classes.srOnly}`]: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: '0'
  },

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

  [`& .${classes.searchEndAdnornment}`]: {
    width: '200px'
  },

  [`& .${classes.sectionSelectionContainer}`]: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#EEEEEE',
    minHeight: '100px'
  },

  [`& .${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    position: 'absolute'
  },

  [`& .${classes.highlighted}`]: {
    borderLeftStyle: 'solid',
    borderLeftColor: '#3777C5',
    borderLeftWidth: '16px'
  },

  [`& .${classes.button}`]: {
    margin: theme.spacing(1),
    marginLeft: '24px',
  }
}))

export interface SelectableCanvasCourseSection extends CanvasCourseSectionWithCourseName {
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
  sectionsRemoved?: (sections: CanvasCourseSectionBase[]) => void
  highlightUnlocked?: boolean
  csrfToken: CsrfToken
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const theme = useTheme()
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

  const [doUnmerge, isUnmerging, unmergeError] = usePromise(
    async (sections: CanvasCourseSectionWithCourseName[]) => await unmergeSections(sections, props.csrfToken.token),
    (unmergedSections: CanvasCourseSectionBase[]) => {
      const unmergedSectionIds = unmergedSections.map(s => s.id)
      setInternalSections(internalSections.filter(section => !unmergedSectionIds.includes(section.id)))
      if (props.sectionsRemoved !== undefined) props.sectionsRemoved(unmergedSections)
    }
  )

  useEffect(() => {
    if (unmergeError !== undefined) {
      enqueueSnackbar(
        <APIErrorMessage context='unmerging' error={unmergeError} />,
        { variant: 'error' }
      )
    }
  }, [unmergeError])

  useEffect(() => {
    if (searcher?.resetTitle !== undefined) searcher.resetTitle()
  }, [searcher])

  const selectableSections = (): SelectableCanvasCourseSection[] => {
    const s = props.sections.filter(s => { return !(s.locked ?? false) })
    return s
  }

  useEffect(() => {
    setInternalSections(props.sections)
    setIsSelectAllChecked(selectableSections().length > 0 && props.selectedSections.length === selectableSections().length)
  }, [props.sections])

  useEffect(() => {
    void init()
  }, [])

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

  const handleChange = (event: SelectChangeEvent): void => {
    const sort = event.target.value
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
    const searchErrors = [searchError, initError].filter(e => e !== undefined) as Error[]
    if (searchErrors.length > 0) {
      enqueueSnackbar(
        <APIErrorMessage context='searching for sections' error={searchErrors[0]} />,
        { variant: 'error' }
      )
    }
  }, [searchError, initError])

  const getSearchTypeAdornment = (): JSX.Element => {
    return (
      <FormControl variant="standard" className={classes.searchEndAdnornment}>
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

  const unmergeButton = (section: SelectableCanvasCourseSection): JSX.Element | undefined => {
    if (section.nonxlist_course_id !== null && props.canUnmerge && (section.locked ?? false)) {
      return (
        <Button
          sx={{ pointerEvents: 'auto', marginTop: '8px'}}
          color='primary'
          variant='contained'
          disabled={isUnmerging}
          onClick={async (e) => {
            e.stopPropagation()
            await doUnmerge([section])
          }}
        >
          Unmerge
        </Button>
      )
    }
  }

  const listItemText = (section: SelectableCanvasCourseSection): JSX.Element => {
    const isSelected = isSectionSelected(section.id)
    return (
      <ListItemText
        primary={section.name}
        style={isSelected ? { color: theme.palette.info.main } : undefined}
        secondary={
          <React.Fragment>
            {
              props.showCourseName === true && (
                <Typography component='span' variant='body2' className={classes.secondaryTypography}>
                  <span className={classes.overflowEllipsis}>{section.course_name}</span>
                </Typography>
              )
            }
            
            <Box component="span" sx={props.showCourseName === true ? { display:'flex', justifyContent:'space-between', alignItems:'center'} : undefined}>
              <Box component="span">{unmergeButton(section)}</Box>
              <Box component="span">{`${section.total_students ?? '?'} students`}</Box>
            </Box>
          </React.Fragment>
        }>
      </ListItemText>
    )
  }

  const actionButton = (): JSX.Element | undefined => {
    if (props.action !== undefined) {
      return (
      <Grid item {...gridSpacing.action}>
        <Button
          className={classes.button}
          style={{ float: 'right' }}
          variant='contained'
          color='primary'
          onClick={props.action.cb}
          disabled={props.action.disabled}
        >
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

  const hasSort = (): boolean => {
    return props.header?.sort !== undefined
  }

  const gridSpacing: Record<'title' | 'select all' | 'sort' | 'action', Record<'sm' | 'xs' | 'md', GridSize>> = {
    title: { xs: 12, sm: 8, md: hasSort() ? 4 : 6 },
    'select all': { xs: 4, sm: 4, md: 3 },
    sort: { xs: 4, sm: 6, md: 2 },
    action: { xs: hasSort() ? 4 : 8, sm: hasSort() ? 6 : 12, md: 3 }
  }

  const sortButton = (): JSX.Element | undefined => {
    if (props.header?.sort !== undefined && props.header.sort?.sorters.length > 0) {
      return (
        <Grid item {...gridSpacing.sort}>
          <Button
            className={classes.button}
            style={{ float: 'left' }}
            aria-controls='simple-menu'
            aria-haspopup='true'
            onClick={handleSortMenuClick}
            disabled={internalSections.length < 2}
          >
            <SortIcon/>Sort
          </Button>
          <Menu
            id='simple-menu'
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
    }
  }

  const checkboxStyle = (): Record<string, unknown> => {
    const xs = useMediaQuery(theme.breakpoints.up('xs'))
    return { float: xs ? 'left' : 'right' }
  }

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <Root>
    <span aria-live='polite' aria-atomic='true' className={classes.srOnly}>
      {props.selectedSections.length} {'section' + (props.selectedSections.length === 1 ? '' : 's')} selected
    </span>
    <Grid container>
      <Grid className={classes.header} container item xs={12}>
        {
          searcher?.isInteractive === true && (
            <Grid item container className={classes.searchContainer} xs={12}>
              <TextField
                className={classes.searchTextField}
                disabled={isSearching || isIniting}
                onChange={searchChange}
                value={searchFieldText}
                id='textField_Search'
                size='small'
                label={searchFieldLabel}
                variant='outlined'
                inputProps={{ maxLength: 256 }}
                InputProps={{ endAdornment: getSearchTextFieldEndAdornment(searchFieldText.length > 0) }}
              />
            </Grid>
          )
        }
        <Grid item container style={{ paddingLeft: '16px' }}>
          {
            props.header?.title !== undefined && (
              <Grid item {...gridSpacing.title} className={classes.title}>
                <Typography variant='h6' component='h2'>
                  {props.header.title}
                  {props.selectedSections.length > 0 && <span> ({props.selectedSections.length})</span>}
                </Typography>
              </Grid>
            )
          }
          {
            props.multiSelect && (
              <Grid item {...gridSpacing['select all']}>
                <FormGroup row style={checkboxStyle()}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelectAllChecked}
                        onChange={handleSelectAllClicked}
                        name='selectAllUnstagedCB'
                        color='primary'
                      />
                    }
                    disabled={selectableSections().length === 0}
                    label='Select All'
                  />
                </FormGroup>
              </Grid>
            )
          }
          {sortButton()}
          {actionButton()}
        </Grid>
      </Grid>
      <Grid item xs={12} className={classes.sectionSelectionContainer}>
        <List className={classes.listContainer} style={{ maxHeight: props.height }} >
          {internalSections.map((section) => {
            const isSelected = isSectionSelected(section.id)
            return (
              <ListItemButton
              key={section.id}
              divider
              disableGutters
              onClick={() => handleListItemClick(section.id)}
              selected={isSelected}
              disabled={section.locked}
              classes={{
                root: `${classes.listItemRoot} ${classes.listButton}`,
                focusVisible: classes.listButtonFocusVisible
              }}>
                {listItemText(section)}
              </ListItemButton>
            )
          })}
          <Backdrop className={classes.backdrop} open={isSearching || isIniting || isUnmerging}>
          <Grid container>
            <Grid item xs={12}><CircularProgress color='inherit' /></Grid>
            <Grid item xs={12}>{isSearching || isIniting ? 'Searching...' : 'Unmerging...'}</Grid>
          </Grid>
        </Backdrop>
      </List>    
      </Grid>
    </Grid>
    </Root>
  )
}

export default SectionSelectorWidget
