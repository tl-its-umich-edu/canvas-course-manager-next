import React, { ComponentType } from 'react'
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'

import { FeatureDataProps, mergeSectionProps, gradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps } from './feature'
import MergeSections from '../pages/MergeSections'

interface FeatureCardProps {
  data: FeatureDataProps
  icon: JSX.Element
  component: ComponentType
  route: string
}

const mergeSectionCardProps: FeatureCardProps = {
  data: mergeSectionProps,
  icon: <MergeTypeIcon fontSize='large' />,
  component: MergeSections,
  route: '/merge-sections'
}

const gradebookToolsCardProps: FeatureCardProps = {
  data: gradebookToolsProps,
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/gradebook'
}

const createSectionsCardProps: FeatureCardProps = {
  data: createSectionsProps,
  icon: <AccountCircleOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/create-sections'
}

const addUMUsersCardProps: FeatureCardProps = {
  data: addUMUsersProps,
  icon: <PersonAddIcon fontSize='large' />,
  component: MergeSections,
  route: '/add-um-users'
}

const addNonUMUsersCardProps: FeatureCardProps = {
  data: addNonUMUsersProps,
  icon: <PersonAddOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/add-non-um-users'
}

const AllFeatures = [mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps]

export type { FeatureCardProps }
export default AllFeatures
