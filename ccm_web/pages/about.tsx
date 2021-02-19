import Head from 'next/head'

import Layout from '../components/layout'

export default function About () {
  return (
    <Layout>
      <Head>
        <title>Canvas Course Manager - About</title>
      </Head>
      <section>
        <h1 className='title'>About</h1>
        <p className='description'>
          Some explanatory text will go here.
        </p>
      </section>
    </Layout>
  )
}
