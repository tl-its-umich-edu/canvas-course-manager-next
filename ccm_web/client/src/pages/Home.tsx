import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard, { FeatureCardProps } from '../components/FeatureCard'

import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275,
    padding: 25
  }
}))

function Home (): JSX.Element {
  const classes = useStyles()

  const mergeSectionProps: FeatureCardProps = {
    id: 'MergeSections',
    title: 'Merge Sections',
    description: 'Combine sections into one Canvas site for easier management',
    icon: <MergeTypeIcon fontSize='large'/>,
    ordinalty: 1
  }

  const gradebookToolsProps: FeatureCardProps = {
    id: 'GradebookTools',
    title: 'Gradebook Tools',
    description: 'Trim the gradebook from Canvas, or trim the gradebook from a third party to correct format',
    icon: <LibraryBooksOutlinedIcon fontSize='large'/>,
    ordinalty: 2
  }

  const addGroupsProps: FeatureCardProps = {
    id: 'AddGroups',
    title: 'Add Groups',
    description: 'Add groups through csv files into your own course',
    icon: <AccountCircleOutlinedIcon fontSize='large'/>,
    ordinalty: 3
  }

  const addUMUsersProps: FeatureCardProps = {
    id: 'addUMUsers',
    title: 'Add UM Users',
    description: 'Add UM users to your available sections',
    icon: <PersonAddIcon fontSize='small'/>,
    ordinalty: 4
  }

  const addNonUMUsersProps: FeatureCardProps = {
    id: 'addNonUMUsers',
    title: 'Add Non-UM Users',
    description: 'Enroll non-UM users to your available sections',
    icon: <PersonAddOutlinedIcon fontSize='small'/>,
    ordinalty: 5
  }

  const cards: FeatureCardProps[] = [mergeSectionProps, gradebookToolsProps, addGroupsProps, addUMUsersProps, addNonUMUsersProps]

  return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                {cards.sort((a, b) => (a.ordinalty < b.ordinalty) ? -1 : 1).map(p => {
                  return (
                    <Grid key={p.id} item xs={12} sm={4}>
                        <FeatureCard {...p}/>
                    </Grid>
                  )
                })}
            </Grid>
        </div>
  )
}

export default Home
