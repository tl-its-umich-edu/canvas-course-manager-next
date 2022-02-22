import React, { useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'
import { Link, makeStyles } from '@material-ui/core'

import { getCourse, getCSRFToken } from './api'
import './App.css'
import AuthorizePrompt from './components/AuthorizePrompt'
import Breadcrumbs from './components/Breadcrumbs'
import ResponsiveHelper from './components/ResponsiveHelper'
import useGlobals from './hooks/useGlobals'
import usePromise from './hooks/usePromise'
import { CanvasCourseBase } from './models/canvas'
import allFeatures from './models/FeatureUIData'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import redirect from './utils/redirect'

const useStyles = makeStyles((theme) => ({
  swaggerLink: {
    display: 'block',
    clear: 'both'
  }
}))

function App (): JSX.Element {
  const classes = useStyles()
  const features = allFeatures.map(f => f.features).flat()

  const location = useLocation()

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
    redirect('/access-denied')
    return (loading)
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

  const pathnames = location !== undefined
    ? location.pathname.split('/').filter(x => x)
    : undefined

  return (
    <div className='App'>
      <Breadcrumbs {...{ features, pathnames }} />
      <Switch>
        <Route exact={true} path='/'>
          <Home globals={globals} course={course} setCourse={setCourse} getCourseError={getCourseError} />
        </Route>
        {features.map(feature => {
          return (
            <Route key={feature.data.id} path={feature.route}>
              <feature.component
                globals={globals}
                course={course}
                title={feature.data.title}
                helpURLEnding={feature.data.helpURLEnding}
              />
            </Route>
          )
        })}
        <Route><NotFound /></Route>
      </Switch>
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
    </div>
  )
}

export default App
