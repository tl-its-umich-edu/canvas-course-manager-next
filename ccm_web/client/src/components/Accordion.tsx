import React from 'react'
import {
  Accordion as MUIAccordion, AccordionDetails as MUIAccordionDetails, AccordionSummary as MUIAccordionSummary,
  makeStyles
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

const useStyles = makeStyles((theme) => ({
  summary: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  },
  icon: {
    color: theme.palette.primary.contrastText
  }
}))

interface AccordionProps {
  title: string
  id: string
  children: React.ReactNode
}

export default function Accordion (props: AccordionProps): JSX.Element {
  const classes = useStyles()
  return (
    <MUIAccordion defaultExpanded>
      <MUIAccordionSummary
        className={classes.summary}
        expandIcon={<ExpandMoreIcon className={classes.icon} />}
        id={`${props.id}-header`}
        aria-controls={`${props.id}-content`}
      >
        {props.title}
      </MUIAccordionSummary>
      <MUIAccordionDetails>
        {props.children}
      </MUIAccordionDetails>
    </MUIAccordion>
  )
}
