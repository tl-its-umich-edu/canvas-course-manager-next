import React from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'

import ConsumerTest from './components/ConsumerTest'
import Home from './pages/Home'
import { mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps } from './components/FeatureCard'
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

function App (): JSX.Element {
  const classes = useStyles()
  const featureCardProps = [mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps]
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
                      const feature = featureCardProps.filter(featureCard => { return featureCard.feature.route.substring(1) === value })[0]
                      const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}

                      return <Typography color='textPrimary' key={to} {...titleTypographyProps}>
                        {feature.feature.title}
                      </Typography>
                    })}
                  </Breadcrumbs>
                )
              }}
            </Route>
          </div>
        <Switch>
          <Route exact={true} path="/" component={Home} />
          {featureCardProps.map(featureCard => {
            return <Route key={featureCard.feature.id} path={featureCard.feature.route} component={featureCard.component} />
          })}
          <Route render={() => (<div><em>Under Construction</em></div>)} />
        </Switch>
      </Router>
      <ConsumerTest/>
    </div>
  )
}

export default App
