import React, { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { getCourse } from './api.js'
import './App.css'
import APIErrorMessage from './components/APIErrorMessage.js'
import AuthorizePrompt from './components/AuthorizePrompt.js'
import ErrorAlert from './components/ErrorAlert.js'
import Layout from './components/Layout.js'
import useGlobals from './hooks/useGlobals.js'
import usePromise from './hooks/usePromise.js'
import { CanvasCourseBase } from './models/canvas.js'
import allFeatures from './models/FeatureUIData.js'
import Home from './pages/Home.js'
import NotFound from './pages/NotFound.js'
import redirect from './utils/redirect.js'
import { Helmet, HelmetProvider } from 'react-helmet-async'

function App (): JSX.Element {
  const features = allFeatures.map(f => f.features).flat()

  const location = useLocation()

  const [globals, csrfToken, isAuthenticated, isLoading, globalsError, csrfTokenCookieError] = useGlobals()

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
  if (globals === undefined || !isAuthenticated || csrfToken === undefined) {
    redirect('/access-denied')
    return (loading)
  }

  if (!globals.user.hasCanvasToken) {
    return (
      <Layout>
        <AuthorizePrompt helpURL={globals.baseHelpURL} />
      </Layout>
    )
  }

  if (isCourseLoading) return loading
  if (getCourseError !== undefined || course === undefined) {
    return (
      <Layout>
        <ErrorAlert
          messages={[<APIErrorMessage key={0} context='loading course data' error={getCourseError} />]}
        />
      </Layout>
    )
  }

  const pathnames = location !== undefined
    ? location.pathname.split('/').filter(x => x)
    : undefined

  return (
  <>
    <Layout {...{ features, pathnames }} devMode={globals?.environment === 'development'} csrfToken={csrfToken}>
      <Routes>
        <Route path='/' element={
          <Home globals={globals} csrfToken={csrfToken} course={course} setCourse={setCourse} getCourseError={getCourseError} />
          } />
        {features.map(feature => {
          return (
            <Route key={feature.data.id} path={feature.route} element={
              <feature.component
                globals={globals}
                csrfToken={csrfToken}
                course={course}
                title={feature.data.title}
                helpURLEnding={feature.data.helpURLEnding}
              />
            }/>
          )
        })}
        <Route path="/*" element={<NotFound />}/>
      </Routes>
    </Layout>
    <HelmetProvider>
      <Helmet>
        <script type="text/javascript">
          {`window.umConsentManager = {
              googleAnalyticsID: ${globals?.googleAnalyticsId ?`'${globals?.googleAnalyticsId}'`: false},
              googleAnalyticsCustom: {
                  streamConfig: {
                      cookie_flags: "SameSite=None; Secure"
                  }
              },
              externalLinkBlank: true,
              privacyUrl: false
            }
        `}  
        </script>
        <script async src="https://umich.edu/apis/umconsentmanager/consentmanager.js"/>
      </Helmet>
    </HelmetProvider>
    </>
  )
}

export default App
