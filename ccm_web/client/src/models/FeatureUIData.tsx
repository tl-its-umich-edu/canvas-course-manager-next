import React, { ComponentType } from 'react'
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'
import PostAddOutlinedIcon from '@material-ui/icons/PostAddOutlined'

import { FeatureDataProps, mergeSectionProps, canvasGradebookToolsProps, thirdPartygradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps } from './feature'
import MergeSections from '../pages/MergeSections'

interface FeatureUIGroup {
  id: string
  title: string
  ordinality: number
  features: FeatureUIProps[]
}

interface FeatureUIProps {
  data: FeatureDataProps
  icon: JSX.Element
  component: ComponentType
  route: string
}

const mergeSectionCardProps: FeatureUIProps = {
  data: mergeSectionProps,
  icon: <MergeTypeIcon fontSize='large' />,
  component: MergeSections,
  route: '/merge-sections'
}

const canvasGradebookCardProps: FeatureUIProps = {
  data: canvasGradebookToolsProps,
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/gradebook-canvas'
}

const thirdPartyGradebookCardProps: FeatureUIProps = {
  data: thirdPartygradebookToolsProps,
  icon: <PostAddOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/gradebook-other'
}

const createSectionsCardProps: FeatureUIProps = {
  data: createSectionsProps,
  icon: <AccountCircleOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/create-sections'
}

const addUMUsersCardProps: FeatureUIProps = {
  data: addUMUsersProps,
  icon: <PersonAddIcon fontSize='large' />,
  component: MergeSections,
  route: '/add-um-users'
}

const addNonUMUsersCardProps: FeatureUIProps = {
  data: addNonUMUsersProps,
  icon: <PersonAddOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/add-non-um-users'
}

const allFeatures: FeatureUIGroup[] = [
  { id: 'GradebookTools', title: 'Gradebook Tools', ordinality: 1, features: [canvasGradebookCardProps, thirdPartyGradebookCardProps] },
  { id: 'Users', title: 'Users', ordinality: 2, features: [addUMUsersCardProps, addNonUMUsersCardProps] },
  { id: 'Sections', title: 'Sections', ordinality: 3, features: [mergeSectionCardProps, createSectionsCardProps] }
]

// const allFeatures = [mergeSectionCardProps, gradebookToolsCardProps, createSectionsCardProps, addUMUsersCardProps, addNonUMUsersCardProps]

export type { FeatureUIGroup, FeatureUIProps }
export default allFeatures
