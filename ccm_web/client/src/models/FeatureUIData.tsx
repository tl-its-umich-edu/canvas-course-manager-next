import React, { ComponentType } from 'react'
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@material-ui/icons/LibraryBooksOutlined'
import MergeTypeIcon from '@material-ui/icons/MergeType'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined'
import PostAddOutlinedIcon from '@material-ui/icons/PostAddOutlined'

import {
  FeatureDataProps, mergeSectionProps, canvasGradebookFormatterProps, externalToolsGradebookFormatterProps,
  createSectionsProps, addUMUsersProps, addNonUMUsersProps
} from './feature'
import AddUMUsers from '../pages/AddUMUsers'
import BulkSectionCreate from '../pages/BulkSectionCreate'
import FormatThirdPartyGradebook from '../pages/FormatThirdPartyGradebook'
import ConvertCanvasGradebook from '../pages/GradebookCanvas'
import MergeSections from '../pages/MergeSections'
import { Globals, RoleEnum } from './models'
import { CanvasCourseBase } from './canvas'

export interface CCMComponentProps {
  globals: Globals
  course: CanvasCourseBase
  helpURLEnding: string
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

const NotYetImplementedComponent = (): JSX.Element => <p>This feature has not been implemented yet.</p>

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

const externalToolsGradebookFormatterCardProps: FeatureUIProps = {
  data: externalToolsGradebookFormatterProps,
  icon: <PostAddOutlinedIcon fontSize='large' />,
  component: FormatThirdPartyGradebook,
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
  component: AddUMUsers,
  route: '/add-um-users'
}

const addNonUMUsersCardProps: FeatureUIProps = {
  data: addNonUMUsersProps,
  icon: <PersonAddOutlinedIcon fontSize='large' />,
  component: NotYetImplementedComponent,
  route: '/add-non-um-users'
}

const allFeatures: FeatureUIGroup[] = [
  { id: 'GradebookTools', title: 'Gradebook Tools', ordinality: 1, features: [canvasGradebookFormatterCardProps, externalToolsGradebookFormatterCardProps] },
  { id: 'Users', title: 'Users', ordinality: 2, features: [addUMUsersCardProps, addNonUMUsersCardProps] },
  { id: 'Sections', title: 'Sections', ordinality: 3, features: [mergeSectionCardProps, createSectionsCardProps] }
]

const isAuthorizedForRoles = (userRoles: RoleEnum[], requiredRoles: RoleEnum[], featureDescriptionForLogging: string): boolean => {
  const rolesAllowingAccess = userRoles.filter(userRole => requiredRoles.includes(userRole))
  return rolesAllowingAccess.length > 0
}

const isAuthorizedForFeature = (roles: RoleEnum[], feature: FeatureUIProps): boolean => {
  return isAuthorizedForRoles(roles, feature.data.roles, feature.route)
}

const isAuthorizedForAnyFeature = (roles: RoleEnum[], features: FeatureUIProps[]): boolean => {
  return features.map(feature => { return isAuthorizedForFeature(roles, feature) }).filter(f => { return f }).length > 0
}

export type { FeatureUIGroup, FeatureUIProps }
export { isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles }
export default allFeatures
