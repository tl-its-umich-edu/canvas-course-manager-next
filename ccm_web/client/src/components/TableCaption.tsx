import React from 'react'
import { styled } from '@mui/material/styles'
const PREFIX = 'TableCaption'

const classes = {
  srOnly: `${PREFIX}-srOnly`
}

const Root = styled('caption')(() => ({
  [`&.${classes.srOnly}`]: {
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

interface TableCaptionProps {
  text: string
}

export default function TableCaption (props: TableCaptionProps): JSX.Element {
  return <Root className={classes.srOnly}>{props.text}</Root>
}
