import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import useGlobals from './hooks/useGlobals'
import allFeatures from './models/FeatureUIData'
import Home from './pages/Home'
import './App.css'
import { CanvasCourseBase } from './models/canvas'
import usePromise from './hooks/usePromise'
import { getCourse } from './api'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    fontSize: '1.125rem'
  },
  breadcrumbContainer: {
    paddingLeft: 25,
    paddingTop: 25
  }
}))

interface TitleTypographyProps {
  to?: string
}

function App (): JSX.Element {
  const classes = useStyles()
  const features = allFeatures.map(f => f.features).flat()

  const [globals, isAuthenticated, isGlobalsLoading, error] = useGlobals()

  const [course, setCourse] = useState<undefined|CanvasCourseBase>(undefined)
  const [doLoadCourse, isCourseLoading, getCourseError] = usePromise<CanvasCourseBase|undefined, typeof getCourse>(
    async (courseId: number): Promise<CanvasCourseBase> => {
      return await getCourse(courseId)
    },
    (value: CanvasCourseBase|undefined) => setCourse(value)
  )

  useEffect(() => {
    if (globals !== undefined) {
      void doLoadCourse(globals.course.id)
    }
  }, [globals])

  if (isAuthenticated === undefined || isGlobalsLoading || isCourseLoading) return <div className='App'><p>Loading...</p></div>

  if (error !== undefined) console.error(error)
  if (globals === undefined || !isAuthenticated) {
    return (
      <div className='App'>
        <p>You were not properly authenticated to the application.</p>
      </div>
    )
  }

  interface BreadcrumbProps {
    isLink: boolean
  }

  const HomeBreadcrumb = (props: BreadcrumbProps): JSX.Element => {
    const typography = (<Typography className={classes.breadcrumbs} color='textPrimary'>
                          Canvas Course Manager
                        </Typography>)
    return props.isLink
      ? (<Link component={RouterLink} to='/'>{typography}</Link>)
      : (typography)
  }

  return (
    <div className='App'>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <div>
            <Route>
              {({ location }) => {
                const pathnames = location.pathname.split('/').filter(x => x)
                return (
                  <Breadcrumbs className={classes.breadcrumbContainer} aria-label="breadcrumb" separator={<NavigateNextIcon fontSize="small" />}>
                    <HomeBreadcrumb isLink={(pathnames.length > 0)} />
                    {pathnames.map((value, index) => {
                      const last = index === pathnames.length - 1
                      const to = `/${pathnames.slice(0, index + 1).join('/')}`
                      const feature = features.filter(f => { return f.route.substring(1) === value })[0]
                      const titleTypographyProps: TitleTypographyProps = last ? { to: to } : {}

                      return (<Typography className={classes.breadcrumbs} color='textPrimary' key={to} {...titleTypographyProps}>
                        {feature.data.title}
                      </Typography>)
                    })}
                  </Breadcrumbs>
                )
              }}
            </Route>
          </div>
          <Switch>
            <Route exact={true} path="/" render={() => (<Home globals={globals} course={course} setCourse={setCourse} getCourseError={getCourseError} />)} />
            {features.map(feature => {
              return <Route key={feature.data.id} path={feature.route} component={feature.component} />
            })}
            <Route render={() => (<div><em>Under Construction</em></div>)} />
          </Switch>
        </Router>
        {globals?.environment === 'development' && <Link href='/swagger'>Swagger UI</Link>}
      </SnackbarProvider>
    </div>
  )
}

export default App
