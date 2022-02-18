import React, { useState } from 'react'
import {
  Accordion as MUIAccordion, AccordionDetails as MUIAccordionDetails, AccordionSummary as MUIAccordionSummary,
  makeStyles
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(1)
  },
  summary: {
    backgroundColor: theme.palette.primary.main
  },
  summaryFocusedVisible: {
    color: theme.palette.primary.main
  },
  summaryUnfocusedVisible: {
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
  const [isSummaryFocusedVisible, setIsSummaryFocusedVisible] = useState(false)
  const summaryTextClass = isSummaryFocusedVisible ? classes.summaryFocusedVisible : classes.summaryUnfocusedVisible

  return (
    <div className={classes.container}>
      <MUIAccordion defaultExpanded>
        <MUIAccordionSummary
          className={classes.summary}
          classes={{ root: summaryTextClass, expandIcon: summaryTextClass }}
          expandIcon={<ExpandMoreIcon />}
          id={`${props.id}-header`}
          aria-controls={`${props.id}-content`}
          onFocusVisible={() => setIsSummaryFocusedVisible(true)}
          onBlur={() => setIsSummaryFocusedVisible(false)}
        >
          {props.title}
        </MUIAccordionSummary>
        <MUIAccordionDetails>
          {props.children}
        </MUIAccordionDetails>
      </MUIAccordion>
    </div>
  )
}
