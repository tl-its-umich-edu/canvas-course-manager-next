import React from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import ConsumerTest from './components/ConsumerTest'
import useGlobals from './hooks/useGlobals'
import allFeatures from './models/FeatureUIData'
import Home from './pages/Home'
import './App.css'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    paddingLeft: 25,
    paddingTop: 25
  }
}))

interface TitleTypographyProps {
  to?: string
}

const breadcrumbVariant = 'h5'

function HomeBreadcrumb (isLink: boolean): JSX.Element {
  const typography = (<Typography color='textPrimary' variant={breadcrumbVariant}>
                        Canvas Course Manager
                      </Typography>)
  return isLink
    ? (<Link component={RouterLink} to='/'>{typography}</Link>)
    : (typography)
}

interface AppProps {
  ltiKey: string | undefined
}

function App (props: AppProps): JSX.Element {
  const classes = useStyles()
  const features = allFeatures.map(f => f.features).flat()

  const [globals, isAuthenticated, loading, error] = useGlobals(props.ltiKey)
  if (isAuthenticated === undefined || loading) return <div className='App'><p>Loading...</p></div>

  if (error !== undefined) console.error(error)
  if (!isAuthenticated) {
    return (
      <div className='App'>
        <p>You were not properly authenticated to the application.</p>
      </div>
    )
  }

  return (
    <div className='App'>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <div className={classes.breadcrumbs}>
            <Route>
                {({ location }) => {
                  const pathnames = location.pathname.split('/').filter(x => x)
                  return (
                    <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon fontSize="small" />}>
                      {HomeBreadcrumb(pathnames.length > 0)}
                      {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`
                        const feature = features.filter(f => { return f.route.substring(1) === value })[0]
                        const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}

                        return (<Typography color='textPrimary' variant={breadcrumbVariant} key={to} {...titleTypographyProps}>
                          {feature.data.title}
                        </Typography>)
                      })}
                    </Breadcrumbs>
                  )
                }}
              </Route>
            </div>
          <Switch>
            <Route exact={true} path="/" component={Home} />
            {features.map(feature => {
              return <Route key={feature.data.id} path={feature.route} component={feature.component} />
            })}
            <Route render={() => (<div><em>Under Construction</em></div>)} />
          </Switch>
        </Router>
        <ConsumerTest ltiKey={props.ltiKey} />
      </SnackbarProvider>
    </div>
  )
}

export default App
