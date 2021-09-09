import { Button, Checkbox, FormControlLabel, FormGroup, Grid, List, ListItem, ListItemText, makeStyles, TextField, Typography } from '@material-ui/core'
import ClearIcon from '@material-ui/icons/Clear'
import React, { useEffect, useState } from 'react'
import { CanvasCourseSection } from '../models/canvas'

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
    textOverflow: 'ellipsis'
  },
  checkBoxContainer: {
    float: 'right',
    textAlign: 'center'
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
  search: 'None' | 'Hidden' | true
  title?: string
  showCourseName?: boolean
  action?: {text: string, cb: () => void, disabled: boolean}
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()

  const [sectionFilterText, setSectionFilterText] = useState<string>('')
  const [filteredSections, setFilteredSections] = useState<SelectableCanvasCourseSection[]>(props.sections)

  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean>(false)

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
    setSectionFilterText(event.target.value)
  }

  const clearSearch = (): void => {
    setSectionFilterText('')
  }

  const getSearchTextFieldEndAdornment = (hasText: boolean): JSX.Element => {
    if (!hasText) {
      return (<></>)
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
                <p className={classes.overflowEllipsis}>{section.course_name}</p>
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
      <Grid item xs={12} sm={3}>
        <Button style={{ float: 'right' }} variant="contained" color="primary" onClick={props.action.cb} disabled={props.action.disabled}>
          {props.action?.text}
        </Button>
      </Grid>
      )
    }
  }

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <span aria-live='polite' aria-atomic='true' className={classes.srOnly}>{props.selectedSections.length} section{props.selectedSections.length === 1 ? '' : 's' } selected</span>
      <Grid container>
        <Grid item container className={classes.searchContainer} style={props.search === 'None' ? { display: 'none' } : props.search === 'Hidden' ? { visibility: 'hidden' } : {}} xs={12}>
          <TextField className={classes.searchTextField} onChange={searchChange} value={sectionFilterText} id='textField_Search' size='small' label='Search Sections' variant='outlined' InputProps={{ endAdornment: getSearchTextFieldEndAdornment(sectionFilterText.length > 0) }}/>
        </Grid>
        <Grid item container>
          <Grid item xs={8} sm={6} className={classes.title}>
            <Typography style={{ visibility: props.title !== undefined ? 'visible' : 'hidden' }}>{props.title}
              <span hidden={props.selectedSections.length === 0}>
                ({props.selectedSections.length})
              </span>
            </Typography>
          </Grid>
          <Grid item xs={4} sm={3}>
            <FormGroup row style={{ visibility: props.multiSelect ? 'visible' : 'hidden' }} className={classes.checkBoxContainer}>
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
          {actionButton()}
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
