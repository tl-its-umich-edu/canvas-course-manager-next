import { TableCell } from '@mui/material'
import { styled } from '@mui/material/styles'
import { grey } from '@mui/material/colors'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: grey[100],
    color: theme.palette.common.black,
    fontWeight: 'bold'
  },
  '&.MuiTableCell-body': {
    fontSize: 24
  }
}))

export default StyledTableCell
