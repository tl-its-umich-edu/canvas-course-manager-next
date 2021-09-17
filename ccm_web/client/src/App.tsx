import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Link as RouterLink, Route, Switch } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { Breadcrumbs, Link, makeStyles, Typography } from '@material-ui/core'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'

import { getCourse, getCSRFToken } from './api'
import useGlobals from './hooks/useGlobals'
import usePromise from './hooks/usePromise'
import { CanvasCourseBase } from './models/canvas'
import allFeatures from './models/FeatureUIData'
import Home from './pages/Home'
import redirect from './utils/redirect'
import './App.css'

const useStyles = makeStyles((theme) => ({
  breadcrumbs: {
    fontSize: '1.125rem'
  },
  breadcrumbContainer: {
    paddingLeft: 25,
    paddingTop: 25
  },
  swaggerLink: {
    display: 'block',
    clear: 'both'
  }
}))

interface TitleTypographyProps {
  to?: string
}

function App (): JSX.Element {
  const classes = useStyles()
  const features = allFeatures.map(f => f.features).flat()

  const [globals, isAuthenticated, isLoading, globalsError, csrfTokenCookieError] = useGlobals()

  const [course, setCourse] = useState<undefined|CanvasCourseBase>(undefined)
  const [doLoadCourse, isCourseLoading, getCourseError] = usePromise<CanvasCourseBase|undefined, typeof getCourse>(
    async (courseId: number): Promise<CanvasCourseBase> => {
      return await getCourse(courseId)
    },
    (value: CanvasCourseBase|undefined) => setCourse(value)
  )

  useEffect(() => {
    if (globals?.user.hasCanvasToken === true) {
      void doLoadCourse(globals.course.id)
    }
  }, [globals])

  const loading = <div className='App'><p>Loading...</p></div>

  if (isAuthenticated === undefined || isLoading || isCourseLoading) return loading

  if (globalsError !== undefined) console.error(globalsError)
  if (csrfTokenCookieError !== undefined) console.error(csrfTokenCookieError)
  if (globals === undefined || !isAuthenticated) {
    return (
      <div className='App'>
        <p>You were not properly authenticated to the application.</p>
      </div>
    )
  }

  if (!globals.user.hasCanvasToken) {
    // Initiate OAuth flow
    redirect('/canvas/redirectOAuth')
    return loading
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
              return <Route key={feature.data.id} path={feature.route} component={() => <feature.component globals={globals} />}/>
            })}
            <Route render={() => (<div><em>Under Construction</em></div>)} />
          </Switch>
        </Router>
        {
          globals?.environment === 'development' &&
          (
            <div className={classes.swaggerLink}>
              <Link href={`/swagger?csrfToken=${String(getCSRFToken())}`}>Swagger UI</Link>
            </div>
          )
        }
      </SnackbarProvider>
    </div>
  )
}

export default App
