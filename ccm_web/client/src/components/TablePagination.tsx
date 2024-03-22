import { IconButton, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import { KeyboardArrowRight, KeyboardArrowLeft, FirstPage, LastPage } from '@mui/icons-material'
import React from 'react'

const classes = {
  root: 'TablePagination-root'
}

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  }
}))

type PageChangeCallback = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, page: number) => void

function TablePaginationActions (props: { count: number, page: number, rowsPerPage: number, onPageChange: PageChangeCallback}): JSX.Element {
  const theme = useTheme()
  const { count, page, rowsPerPage, onPageChange } = props

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    onPageChange(event, 0)
  }

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    onPageChange(event, page - 1)
  }

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    onPageChange(event, props.page + 1)
  }

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
  }

  return (
    <Root className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
        size="large">
        {theme.direction === 'rtl' ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        size="large">
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        size="large">
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
        size="large">
        {theme.direction === 'rtl' ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Root>
  )
}

export { TablePaginationActions }
