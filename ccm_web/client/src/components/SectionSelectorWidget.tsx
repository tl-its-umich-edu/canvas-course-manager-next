import { List, ListItem, ListItemText, makeStyles } from '@material-ui/core'
import React from 'react'
import { CanvasCourseSection } from '../models/canvas'

const useStyles = makeStyles((theme) => ({

}))

interface ISectionSelectorWidgetProps {
  sections: CanvasCourseSection[]
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

  return (
    <>
    <List>
      {props.sections.map((section, index) => {
        return (<ListItem key={section.id} button selected={selectedIndex === index} onClick={(event) => handleListItemClick(event, index)}>
          <ListItemText primary={section.name}></ListItemText>
        </ListItem>)
      })}
     </List>
    </>
  )
}

export default SectionSelectorWidget
