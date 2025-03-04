import React, { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { getCourse } from './api.js'
import './App.css'
import APIErrorMessage from './components/APIErrorMessage.js'
import AuthorizePrompt from './components/AuthorizePrompt.js'
import ErrorAlert from './components/ErrorAlert.js'
import Layout from './components/Layout.js'
import usePromise from './hooks/usePromise.js'
import { useGoogleAnalytics, UseGoogleAnalyticsParams } from '@tl-its-umich-edu/react-ga-onetrust-consent'
import { CanvasCourseBase } from './models/canvas.js'
import allFeatures from './models/FeatureUIData.js'
import Home from './pages/Home.js'
import NotFound from './pages/NotFound.js'
import redirect from './utils/redirect.js'
import { Globals } from './models/models.js'

interface HomeProps {
  globals: Globals
}

function App (props: HomeProps): JSX.Element {
  const { globals } = props
  const features = allFeatures.map(f => f.features).flat()

  const location = useLocation()

  const googleAnalyticsConfig: UseGoogleAnalyticsParams = {
    googleAnalyticsId: globals?.googleAnalyticsId ?? '',
    oneTrustScriptDomain: globals?.oneTrustScriptDomain ?? '',
    debug: false
  }
  useGoogleAnalytics(googleAnalyticsConfig);

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

  if (globals === undefined) {
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
    <Layout {...{ features, pathnames }} devMode={globals?.environment === 'development'} isAdmin={globals?.user.isStaff?? false} >
      <Routes>
        <Route path='/' element={
          <Home globals={globals} course={course} setCourse={setCourse} getCourseError={getCourseError} />
          } />
        {features.map(feature => {
          return (
            <Route key={feature.data.id} path={feature.route} element={
              <feature.component
                globals={globals}
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
  )
}

export default App
