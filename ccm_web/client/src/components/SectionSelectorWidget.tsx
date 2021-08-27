import { Button, Grid, List, ListItem, ListItemText, makeStyles, TextField } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { CanvasCourseSection } from '../models/canvas'

const useStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto'
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

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <Grid container>
        <Grid item container className={classes.searchContainer} xs={12}>
          <Grid item xs={10}>
            <TextField className={classes.searchTextField} onChange={searchChange} value={sectionFilterText} id='textField_Search' size='small' label='Search Sections' variant='outlined' />
          </Grid>
          <Grid item xs={2}>
            <Button variant='contained' disableElevation onClick={clearSearch} disabled={sectionFilterText.length === 0}>Clear</Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <List className={classes.root} style={{ maxHeight: props.height, minHeight: props.height }}>
            {filteredSections.map((section, index) => {
              return (<ListItem divider key={section.id} button selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
                <ListItemText primary={section.name} secondary={`${section.total_students ?? '?'} users`}></ListItemText>
              </ListItem>)
            })}
          </List>
        </Grid>
      </Grid>
    </>
  )
}

export default SectionSelectorWidget
