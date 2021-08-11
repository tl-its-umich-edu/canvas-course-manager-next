import { List, ListItem, ListItemText, makeStyles, Paper } from '@material-ui/core'
import React, { useEffect } from 'react'
import { CanvasCourseSection } from '../models/canvas'

const useStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto'
  }
}))

interface ISectionSelectorWidgetProps {
  sections: CanvasCourseSection[]
  height: number
  setSelectedCourse: (section: CanvasCourseSection|undefined) => void
}

function SectionSelectorWidget (props: ISectionSelectorWidgetProps): JSX.Element {
  const classes = useStyles()

  const [selectedIndex, setSelectedIndex] = React.useState<number|undefined>(undefined)
  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ): void => {
    setSelectedIndex(index)
  }

  useEffect(() => {
    props.setSelectedCourse(selectedIndex !== undefined ? props.sections[selectedIndex] : undefined)
  }, [selectedIndex])

  // Passing in the height in the props seems like the wrong solution, but wanted to move on from solving that for now
  return (
    <>
      <List className={classes.root} style={{ maxHeight: props.height }}>
        {props.sections.map((section, index) => {
          return (<ListItem divider key={section.id} button selected={selectedIndex === index} onClick={(event) => handleListItemClick(event, index)}>
            <ListItemText primary={section.name} secondary={`${section.total_students ?? '?'} users`}></ListItemText>
          </ListItem>)
        })}
      </List>
    </>
  )
}

export default SectionSelectorWidget
