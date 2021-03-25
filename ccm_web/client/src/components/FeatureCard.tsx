import React, { ComponentType } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'

import { FeatureProps, mergeSectionProps, gradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps } from '../models/feature'
import MergeSections from '../pages/MergeSections'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#FAFAFA',
    height: 200
  },
  centered: {
    width: '100%'
  },
  title: {
    fontSize: 14
  },
  cardLink: {
    textDecoration: 'none'
  }
}))

interface FeatureCardProps {
  feature: FeatureProps
  icon: JSX.Element
  component: ComponentType
}

const mergeSectionCardProps: FeatureCardProps = {
  feature: mergeSectionProps,
  icon: <MergeTypeIcon fontSize='large' />,
  component: MergeSections
}

const gradebookToolsCardProps: FeatureCardProps = {
  feature: gradebookToolsProps,
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  component: MergeSections
}

const createSectionsCardProps: FeatureCardProps = {
  feature: createSectionsProps,
  icon: <AccountCircleOutlinedIcon fontSize='large' />,
  component: MergeSections
}

const addUMUsersCardProps: FeatureCardProps = {
  feature: addUMUsersProps,
  icon: <PersonAddIcon fontSize='large' />,
  component: MergeSections
}

const addNonUMUsersCardProps: FeatureCardProps = {
  feature: addNonUMUsersProps,
  icon: <PersonAddOutlinedIcon fontSize='large' />,
  component: MergeSections
}

function FeatureCard (props: FeatureCardProps): JSX.Element {
  const classes = useStyles()

  return (
    <Link className={classes.cardLink} to={props.feature.route} >
      <Card className={`${classes.root}`} variant="outlined" tabIndex={props.feature.ordinality}>
        <CardContent>
          <Grid container>
            <Grid item xs={12}>
              <div className={classes.centered}>
                {props.icon}
              </div>
              <div className={classes.centered}>
                <Typography className={classes.title} color="textPrimary" gutterBottom>
                  {props.feature.title}
                </Typography>
                <Typography variant="body2" component="p" color="textSecondary">
                  {props.feature.description}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Link>
  )
}

export type { FeatureCardProps }
export { FeatureCard as default, mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps }
