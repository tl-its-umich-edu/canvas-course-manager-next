import { createTheme, adaptV4Theme } from '@mui/material/styles'

const ccmTheme = createTheme(adaptV4Theme({
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
  },
  props: {
    MuiLink: {
      underline: 'always'
    }
  }
}))

export default ccmTheme
