import { List, ListItem, ListItemText, makeStyles } from '@material-ui/core'
import React from 'react'
import { CanvasCourseSection } from '../models/canvas'

const useStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto'
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

  const handleListItemClick = (
    sectionId: number
  ): void => {
    let newSelections = [...props.selectedSections]
    const alreadySelected = props.selectedSections.filter(s => { return s.id === sectionId })
    if (alreadySelected.length > 0) {
      newSelections.splice(newSelections.indexOf(alreadySelected[0]), 1)
    } else {
      if (props.multiSelect) {
        newSelections.push(props.sections.filter(s => { return s.id === sectionId })[0])
      } else {
        newSelections = [props.sections.filter(s => { return s.id === sectionId })[0]]
      }
    }
    props.selectionUpdated(newSelections)
  }

  const isSectionSelected = (sectionId: number): boolean => {
    return props.selectedSections.map(s => { return s.id }).includes(sectionId)
  }

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <List className={classes.root} style={{ maxHeight: props.height, minHeight: props.height }}>
        {props.sections.map((section, index) => {
          return (<ListItem divider key={section.id} button selected={isSectionSelected(section.id)} onClick={(event) => handleListItemClick(section.id)}>
            <ListItemText primary={section.name} secondary={`${section.total_students ?? '?'} users`}></ListItemText>
          </ListItem>)
        })}
      </List>
    </>
  )
}

export default SectionSelectorWidget
