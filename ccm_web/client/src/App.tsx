import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { Link, makeStyles } from '@material-ui/core'
import { SnackbarProvider } from 'notistack'

import { getCourse, getCSRFToken } from './api'
import AuthorizePrompt from './components/AuthorizePrompt'
import Breadcrumbs from './components/Breadcrumbs'
import useGlobals from './hooks/useGlobals'
import usePromise from './hooks/usePromise'
import { CanvasCourseBase } from './models/canvas'
import allFeatures from './models/FeatureUIData'
import Home from './pages/Home'
import './App.css'
import ResponsiveHelper from './components/ResponsiveHelper'

const useStyles = makeStyles((theme) => ({
  swaggerLink: {
    display: 'block',
    clear: 'both'
  }
}))

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

  if (isAuthenticated === undefined || isLoading) return loading

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
    return (
      <div className='App'>
        <Breadcrumbs />
        <AuthorizePrompt helpURL={globals.baseHelpURL} />
      </div>
    )
  }

  if (isCourseLoading) return loading
  if (getCourseError !== undefined || course === undefined) {
    return (
      <div className='App'>
        <p>Course info failed to load.</p>
      </div>
    )
  }

  return (
    <div className='App'>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <div>
            <Route>
              {({ location }) => {
                const pathnames = location.pathname.split('/').filter(x => x)
                return <Breadcrumbs {...{ features, pathnames }} />
              }}
            </Route>
          </div>
          <Switch>
            <Route
              exact={true}
              path='/'
              render={() => (
                <Home globals={globals} course={course} setCourse={setCourse} getCourseError={getCourseError} />
              )}
            />
            {features.map(feature => {
              return (
                <Route
                  key={feature.data.id}
                  path={feature.route}
                  component={() => (
                    <feature.component
                      globals={globals}
                      course={course}
                      title={feature.data.title}
                      helpURLEnding={feature.data.helpURLEnding}
                    />
                  )}
                />
              )
            })}
            <Route render={() => (<div><em>Under Construction</em></div>)} />
          </Switch>
        </Router>
        {
          globals?.environment === 'development' &&
          (
            <div>
              <div className={classes.swaggerLink}>
                <Link href={`/swagger?csrfToken=${String(getCSRFToken())}`}>Swagger UI</Link>
              </div>
              <div style={{ position: 'fixed', right: '25px', top: '25px', zIndex: 999 }}>
                <ResponsiveHelper/>
              </div>
            </div>
          )
        }
      </SnackbarProvider>
    </div>
  )
}

export default App
