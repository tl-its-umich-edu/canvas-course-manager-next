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
  summaryFocusVisible: {
    color: theme.palette.primary.main
  },
  summaryFocusNotVisible: {
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
  const [isSummaryFocusVisible, setIsSummaryFocusVisible] = useState(false)
  const summaryTextClass = isSummaryFocusVisible ? classes.summaryFocusVisible : classes.summaryNotFocusVisible

  return (
    <div className={classes.container}>
      <MUIAccordion defaultExpanded>
        <MUIAccordionSummary
          className={classes.summary}
          classes={{ root: summaryTextClass, expandIcon: summaryTextClass }}
          expandIcon={<ExpandMoreIcon />}
          id={`${props.id}-header`}
          aria-controls={`${props.id}-content`}
          onFocusVisible={() => setIsSummaryFocusVisible(true)}
          onBlur={() => setIsSummaryFocusVisible(false)}
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
