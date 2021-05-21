import React, { ComponentType } from 'react'
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'
import PostAddOutlinedIcon from '@material-ui/icons/PostAddOutlined'

import { FeatureDataProps, mergeSectionProps, canvasGradebookFormatterProps, ExternalToolsGradebookFormatterProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps } from './feature'
import ConvertCanvasGradebook from '../pages/GradebookCanvas'
import MergeSections from '../pages/MergeSections'
import BulkSectionCreate from '../pages/BulkSectionCreate'
import { LtiProps } from '../api'

export interface CCMComponentProps extends LtiProps {

}

interface FeatureUIGroup {
  id: string
  title: string
  ordinality: number
  features: FeatureUIProps[]
}

interface FeatureUIProps {
  data: FeatureDataProps
  icon: JSX.Element
  component: ComponentType<CCMComponentProps>
  route: string
}

const mergeSectionCardProps: FeatureUIProps = {
  data: mergeSectionProps,
  icon: <MergeTypeIcon fontSize='large' />,
  component: MergeSections,
  route: '/merge-sections'
}

const canvasGradebookFormatterCardProps: FeatureUIProps = {
  data: canvasGradebookFormatterProps,
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  component: ConvertCanvasGradebook,
  route: '/gradebook-canvas'
}

const ExternalToolsGradebookFormatterCardProps: FeatureUIProps = {
  data: ExternalToolsGradebookFormatterProps,
  icon: <PostAddOutlinedIcon fontSize='large' />,
  component: MergeSections,
  route: '/gradebook-thirdparty'
}

const createSectionsCardProps: FeatureUIProps = {
  data: createSectionsProps,
  icon: <AccountCircleOutlinedIcon fontSize='large' />,
  component: BulkSectionCreate,
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
  { id: 'GradebookTools', title: 'Gradebook Tools', ordinality: 1, features: [canvasGradebookFormatterCardProps, ExternalToolsGradebookFormatterCardProps] },
  { id: 'Users', title: 'Users', ordinality: 2, features: [addUMUsersCardProps, addNonUMUsersCardProps] },
  { id: 'Sections', title: 'Sections', ordinality: 3, features: [mergeSectionCardProps, createSectionsCardProps] }
]

export type { FeatureUIGroup, FeatureUIProps }
export default allFeatures
