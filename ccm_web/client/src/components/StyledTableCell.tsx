import { createStyles, TableCell, Theme, withStyles } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: grey[100],
      color: theme.palette.common.black,
      fontWeight: 'bold'
    },
    body: {
      fontSize: 24
    }
  })
)(TableCell)

export default StyledTableCell
