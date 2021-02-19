import Head from 'next/head'

import Layout from '../components/layout'

export default function Home () {
  return (
    <>
      <Head>
        <title>Canvas Course Manager</title>
      </Head>
      <Layout>
        <section>
          <h1 className='title'>Canvas Course Manager</h1>
          <p className='description'>
            Get started by editing{' '}
            <code className='code'>pages/index.js</code>
          </p>
        </section>
      </Layout>
    </>
  )
}
