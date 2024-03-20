import React, { ComponentType } from 'react'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import MergeTypeIcon from '@mui/icons-material/MergeType'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined'

import {
  FeatureDataProps, mergeSectionProps, formatCanvasGradebookProps, formatThirdPartyGradebookProps,
  createSectionsProps, addUMUsersProps, addNonUMUsersProps
} from './feature'
import AddNonUMUsers from '../pages/AddNonUMUsers'
import AddUMUsers from '../pages/AddUMUsers'
import BulkSectionCreate from '../pages/BulkSectionCreate'
import FormatThirdPartyGradebook from '../pages/FormatThirdPartyGradebook'
import ConvertCanvasGradebook from '../pages/GradebookCanvas'
import MergeSections from '../pages/MergeSections'
import { CsrfToken, Globals, RoleEnum } from './models'
import { CanvasCourseBase, CanvasCourseSectionWithCourseName, ClientEnrollmentType } from './canvas'

export interface CCMComponentProps {
  globals: Globals
  csrfToken: CsrfToken
  course: CanvasCourseBase
  title: string
  helpURLEnding: string
}

interface EnrollmentFeatureLeafProps {
  sections: CanvasCourseSectionWithCourseName[]
  doGetSections: () => Promise<void>
  isGetSectionsLoading: boolean
  getSectionsError: Error | undefined
  featureTitle: string
  settingsURL: string
  resetFeature: () => void
}

export interface AddUMUsersLeafProps extends EnrollmentFeatureLeafProps {}

export interface AddNonUMUsersLeafProps extends EnrollmentFeatureLeafProps {
  readonly rolesUserCanEnroll: ClientEnrollmentType[]
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

const formatCanvasGradebookCardProps: FeatureUIProps = {
  data: formatCanvasGradebookProps,
  icon: <LibraryBooksOutlinedIcon fontSize='large' />,
  component: ConvertCanvasGradebook,
  route: '/gradebook-canvas'
}

const formatThirdPartyGradebookCardProps: FeatureUIProps = {
  data: formatThirdPartyGradebookProps,
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
  component: AddNonUMUsers,
  route: '/add-non-um-users'
}

const allFeatures: FeatureUIGroup[] = [
  { id: 'GradebookTools', title: 'Gradebook Tools', ordinality: 1, features: [formatCanvasGradebookCardProps, formatThirdPartyGradebookCardProps] },
  { id: 'Users', title: 'Users', ordinality: 2, features: [addUMUsersCardProps, addNonUMUsersCardProps] },
  { id: 'Sections', title: 'Sections', ordinality: 3, features: [mergeSectionCardProps, createSectionsCardProps] }
]

const isAuthorizedForRoles = (userRoles: RoleEnum[], requiredRoles: RoleEnum[]): boolean => {
  const rolesAllowingAccess = userRoles.filter(userRole => requiredRoles.includes(userRole))
  return rolesAllowingAccess.length > 0
}

const isAuthorizedForFeature = (roles: RoleEnum[], feature: FeatureUIProps): boolean => {
  return isAuthorizedForRoles(roles, feature.data.roles)
}

const isAuthorizedForAnyFeature = (roles: RoleEnum[], features: FeatureUIProps[]): boolean => {
  return features.map(feature => { return isAuthorizedForFeature(roles, feature) }).filter(f => { return f }).length > 0
}

export type { FeatureUIGroup, FeatureUIProps }
export { isAuthorizedForAnyFeature, isAuthorizedForFeature, isAuthorizedForRoles }
export default allFeatures
