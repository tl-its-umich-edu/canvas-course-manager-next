import { createTheme } from '@material-ui/core/styles'

const ccmTheme = createTheme({
  palette: {
    primary: {
      main: '#00274C'
    },
    error: {
      main: '#E31C3D'
    },
    warning: {
      main: '#E2CF2A'
    },
    success: {
      main: '#306430'
    },
    info: {
      main: '#3F648E'
    }
  }
})

export default ccmTheme
