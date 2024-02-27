import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import {
  Accordion as MUIAccordion,
  AccordionDetails as MUIAccordionDetails,
  AccordionSummary as MUIAccordionSummary
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const PREFIX = 'Accordion'

const classes = {
  container: `${PREFIX}-container`,
  summary: `${PREFIX}-summary`,
  summaryFocusVisible: `${PREFIX}-summaryFocusVisible`,
  summaryFocusNotVisible: `${PREFIX}-summaryFocusNotVisible`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.container}`]: {
    paddingTop: theme.spacing(1)
  },

  [`& .${classes.summary}`]: {
    backgroundColor: theme.palette.primary.main
  },

  [`& .${classes.summaryFocusVisible}`]: {
    color: theme.palette.primary.main
  },

  [`& .${classes.summaryFocusNotVisible}`]: {
    color: theme.palette.primary.contrastText
  }
}))

interface AccordionProps {
  title: string
  id: string
  children: React.ReactNode
}

export default function Accordion (props: AccordionProps): JSX.Element {
  const [isSummaryFocusVisible, setIsSummaryFocusVisible] = useState(false)
  const summaryTextClass = isSummaryFocusVisible ? classes.summaryFocusVisible : classes.summaryFocusNotVisible

  return (
    <Root className={classes.container}>
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
    </Root>
  )
}
