import { Grid, List, ListItem, ListItemText, makeStyles, TextField } from '@material-ui/core'
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
  }
}))

interface ISectionSelectorWidgetProps {
  sections: CanvasCourseSection[]
  selectedSections: CanvasCourseSection[]
  height: number
  multiSelect: boolean
  selectionUpdated: (section: CanvasCourseSection[]) => void
  search: 'None' | 'Hidden' | true
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()

  const [sectionFilterText, setSectionFilterText] = useState<string>('')
  const [filteredSections, setFilteredSections] = useState<CanvasCourseSection[]>(props.sections)

  useEffect(() => {
    if (sectionFilterText.length === 0) {
      setFilteredSections(props.sections)
    } else {
      setFilteredSections(props.sections.filter(p => { return p.name.toUpperCase().includes(sectionFilterText.toUpperCase()) }))
    }
  }, [sectionFilterText, props.sections])

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
  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <Grid container>
        <Grid item container className={classes.searchContainer} style={props.search === 'None' ? { display: 'none' } : props.search === 'Hidden' ? { visibility: 'hidden' } : {}} xs={12}>
          <TextField className={classes.searchTextField} onChange={searchChange} value={sectionFilterText} id='textField_Search' size='small' label='Search Sections' variant='outlined' InputProps={{ endAdornment: getSearchTextFieldEndAdornment(sectionFilterText.length > 0) }}/>
        </Grid>
        <Grid item xs={12}>
          <List className={classes.listContainer} style={{ maxHeight: props.height }}>
            {filteredSections.map((section, index) => {
              return (<ListItem divider key={section.id} button selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
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
