import React from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'

import ConsumerTest from './components/ConsumerTest'
import Home, { featureCardProps } from './pages/Home'
import './App.css'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    paddingLeft: 25,
    paddingTop: 25
  }
}))

function App (): JSX.Element {
  const classes = useStyles()
  return (
    <div className='App'>
      <Router>
        <div className={classes.breadcrumbs}>
          <Route>
              {({ location }) => {
                const pathnames = location.pathname.split('/').filter(x => x)
                return (
                  <Breadcrumbs aria-label="breadcrumb">
                    <Link component={RouterLink} to='/'>
                      <Typography color='textPrimary'>
                        Canvas Course Manager
                      </Typography>
                    </Link>

                    {pathnames.map((value, index) => {
                      const last = index === pathnames.length - 1
                      const to = `/${pathnames.slice(0, index + 1).join('/')}`

                      return last
                        ? (
                            <Typography color="textPrimary" key={to}>
                              {featureCardProps.filter(feature => { return feature.route.substring(1) === value })[0].title}
                            </Typography>
                          )
                        : (
                            <RouterLink color="textPrimary" to={to} key={to}>
                              {featureCardProps.filter(feature => { return feature.route.substring(1) === value })[0].title}
                            </RouterLink>
                          )
                    })}
                  </Breadcrumbs>
                )
              }}
            </Route>
          </div>
        <Switch>
          <Route exact={true} path="/" component={Home} />
          {featureCardProps.map(feature => {
            return <Route key={feature.id} path={feature.route} component={feature.component} />
          })}
          <Route render={() => (<div><em>Under Construction</em></div>)} />
        </Switch>
      </Router>
      <ConsumerTest/>
    </div>
  )
}

export default App
