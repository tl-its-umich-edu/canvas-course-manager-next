import { Checkbox, FormControlLabel, FormGroup, Grid, List, ListItem, ListItemText, makeStyles, TextField, Typography } from '@material-ui/core'
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
    console.debug(`SectionSelectorWidget ${props.title ?? ''} selectedSections changed`)
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

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <span aria-live='polite' className={classes.srOnly}>{props.selectedSections.length} selected</span>
      <Grid container>
        <Grid item container className={classes.searchContainer} style={props.search === 'None' ? { display: 'none' } : props.search === 'Hidden' ? { visibility: 'hidden' } : {}} xs={12}>
          <TextField className={classes.searchTextField} onChange={searchChange} value={sectionFilterText} id='textField_Search' size='small' label='Search Sections' variant='outlined' InputProps={{ endAdornment: getSearchTextFieldEndAdornment(sectionFilterText.length > 0) }}/>
        </Grid>
        <Grid item container>
          <Grid item xs={12} sm={8} className={classes.title}>
            <Typography style={{ visibility: props.title !== undefined ? 'visible' : 'hidden' }}>{props.title}
              <span hidden={props.selectedSections.length === 0}>
                ({props.selectedSections.length})
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormGroup row style={{ visibility: props.multiSelect ? 'visible' : 'hidden' }}>
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
        </Grid>
        <Grid item xs={12}>
          <List className={classes.listContainer} style={{ maxHeight: props.height }}>
            {filteredSections.map((section, index) => {
              return (<ListItem divider key={section.id} button disabled={section.locked} selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
                <ListItemText primary={section.name} secondary={`${section.total_students ?? '?'} students`}></ListItemText>
              </ListItem>)
            })}
          </List>
        </Grid>
      </Grid>
    </>
  )
}

export default SectionSelectorWidget
