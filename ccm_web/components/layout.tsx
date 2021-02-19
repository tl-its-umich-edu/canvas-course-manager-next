import Head from 'next/head'
import Link from 'next/link'

import styles from './layout.module.css'

interface LayoutProps { }

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className={styles.container}>
      <Head>
        <link rel='icon' href='/favicon.ico' />
        <meta
          name='description'
          content='Perform special administrative Canvas tasks'
        />
      </Head>
      <div className={styles.navbar}>
        <span className={styles.navitem}>
          <Link href='/'><a>Home</a></Link>
        </span>
        <span className={styles.navitem}>
          <Link href="/about"><a >About</a></Link>
        </span>
      </div>
      <main>{props.children}</main>
    </div>
  )
}

export default Layout
