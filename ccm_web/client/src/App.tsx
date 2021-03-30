import React from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import ConsumerTest from './components/ConsumerTest'
import Home from './pages/Home'
import './App.css'
import allFeatures from './models/FeatureUIData'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    paddingLeft: 25,
    paddingTop: 25
  }
}))

interface TitleTypographyProps {
  to?: string
}

function HomeBreadcrumb (pathnames: string[]): JSX.Element {
  const typography = (<Typography color='textPrimary'>
                        Canvas Course Manager
                      </Typography>)
  return pathnames.length > 0
    ? (<Link component={RouterLink} to='/'>{typography}</Link>)
    : (typography)
}

function App (): JSX.Element {
  const classes = useStyles()
  const features = allFeatures

  return (
    <div className='App'>
      <Router>
        <div className={classes.breadcrumbs}>
          <Route>
              {({ location }) => {
                const pathnames = location.pathname.split('/').filter(x => x)
                return (
                  <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon fontSize="small" />}>
                    {HomeBreadcrumb(pathnames)}
                    {pathnames.map((value, index) => {
                      const last = index === pathnames.length - 1
                      const to = `/${pathnames.slice(0, index + 1).join('/')}`
                      const feature = features.filter(f => { return f.route.substring(1) === value })[0]
                      const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}

                      return (<Typography color='textPrimary' key={to} {...titleTypographyProps}>
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
      <ConsumerTest/>
    </div>
  )
}

export default App
