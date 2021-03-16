import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import FeatureCard, { FeatureCardProps } from './FeatureCard'

import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    minWidth: 275
  }
}))

function Home (): JSX.Element {
  const classes = useStyles()

  const mergeSectionProps: FeatureCardProps = {
    title: 'Merge Sections',
    description: 'Combine sections taught by yourself or others into one Canvas site for easier management',
    icon: <MergeTypeIcon fontSize='large'/>,
    size: 'tall'
  }

  const gradebookToolsProps: FeatureCardProps = {
    title: 'Gradebook Tools',
    description: 'Trim the gradebook from Canvas, or trim the gradebook from a third party to correct format',
    icon: <LibraryBooksOutlinedIcon fontSize='large'/>,
    size: 'short'
  }

  const addSectionsGroupsProps: FeatureCardProps = {
    title: 'Add Sections / Groups',
    description: 'Add sections, groups through csv viles into your own course',
    icon: <AccountCircleOutlinedIcon fontSize='large'/>,
    size: 'tall'
  }

  const addUMUsersProps: FeatureCardProps = {
    title: 'Add UM Users',
    description: 'Add UM users to your available sections',
    icon: <PersonAddIcon fontSize='small'/>,
    size: 'short'
  }

  const addNonUMUsersProps: FeatureCardProps = {
    title: 'Add Non-UM Users',
    description: 'Enroll non-UM users to your available sections',
    icon: <PersonAddOutlinedIcon fontSize='small'/>,
    size: 'short'
  }

  return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <FeatureCard {...mergeSectionProps}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FeatureCard {...gradebookToolsProps}/>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FeatureCard {...addUMUsersProps}/>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                        <FeatureCard {...addNonUMUsersProps}/>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <FeatureCard {...addSectionsGroupsProps}/>
                </Grid>
            </Grid>
        </div>
  )
}

export default Home
