import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard, { FeatureCardProps } from '../components/FeatureCard'

import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'
import InlineTextEdit from '../components/InlineTextEdit'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275,
    padding: 25
  }
}))

const mergeSectionProps: FeatureCardProps = {
  id: 'MergeSections',
  title: 'Merge Sections',
  description: 'Combine sections into one Canvas site for easier management',
  icon: <MergeTypeIcon fontSize='large' />,
  ordinality: 1,
  route: '/merge-sections'
}
const gradebookToolsProps: FeatureCardProps = {
  id: 'GradebookTools',
  title: 'Gradebook Tools',
  description: 'Trim the gradebook from Canvas, or trim the gradebook from a third party to correct format',
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  ordinality: 2,
  route: '/gradebook'
}

const createSectionsProps: FeatureCardProps = {
  id: 'CreateSections',
  title: 'Create Sections',
  description: 'Create sections through csv files into your own course',
  icon: <AccountCircleOutlinedIcon fontSize='large' />,
  ordinality: 3,
  route: '/create-sections'
}

const addUMUsersProps: FeatureCardProps = {
  id: 'addUMUsers',
  title: 'Add UM Users',
  description: 'Add UM users to your available sections',
  icon: <PersonAddIcon fontSize='large' />,
  ordinality: 4,
  route: '/add-um-users'
}

const addNonUMUsersProps: FeatureCardProps = {
  id: 'addNonUMUsers',
  title: 'Add Non-UM Users',
  description: 'Enroll non-UM users to your available sections',
  icon: <PersonAddOutlinedIcon fontSize='large' />,
  ordinality: 5,
  route: '/add-non-um-users'
}

function Home (): JSX.Element {
  const classes = useStyles()

  const cards: FeatureCardProps[] = [mergeSectionProps, gradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps]

  const saveCourseName = async (courseName: string): Promise<void> => await new Promise<void>((resolve, reject) => {
    console.log('saveCourseName ' + courseName)
    if (courseName === 'reject') {
      reject(new Error('Rejected as requested'))
    } else {
      return resolve()
    }
  })

  return (
    <div className={classes.root}>
      <InlineTextEdit {...{ text: 'Course 123ABC', save: saveCourseName }} />
      <Grid container spacing={3}>
        {cards.sort((a, b) => (a.ordinality < b.ordinality) ? -1 : 1).map(p => {
          return (
            <Grid key={p.id} item xs={12} sm={4}>
              <FeatureCard {...p} />
            </Grid>
          )
        })}
      </Grid>
    </div>
  )
}

export { Home as default, mergeSectionProps }
