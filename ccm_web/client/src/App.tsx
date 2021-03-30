import React from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'

import ConsumerTest from './components/ConsumerTest'
import Home from './pages/Home'
import './App.css'
import AllFeatures from './models/FeatureCardData'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    paddingLeft: 25,
    paddingTop: 25
  }
}))

interface TitleTypographyProps {
  to?: string
}

function App (): JSX.Element {
  const classes = useStyles()
  const features = AllFeatures
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
                      const feature = features.filter(feature => { return feature.route.substring(1) === value })[0]
                      const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}

                      return <Typography color='textPrimary' key={to} {...titleTypographyProps}>
                        {feature.data.title}
                      </Typography>
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
