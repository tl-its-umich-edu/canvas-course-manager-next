import { RoleEnum } from './models.js'

interface FeatureDataProps {
  id: string
  title: string
  description: string
  ordinality: number
  roles: RoleEnum[]
  helpURLEnding: string
}

const adminRoles: RoleEnum[] = [RoleEnum['Subaccount admin'], RoleEnum['Account Admin'], RoleEnum['Support Consultant']]
const courseRenameRoles: RoleEnum[] = adminRoles
const createSectionRoles: RoleEnum[] = [RoleEnum.Teacher, ...adminRoles]

const mergeSectionProps: FeatureDataProps = {
  id: 'MergeSections',
  title: 'Merge Sections',
  description: 'Combine sections into one Canvas site for easier management',
  ordinality: 1,
  roles: [RoleEnum.Teacher, ...adminRoles],
  helpURLEnding: '/merge-sections.html'
}

const formatCanvasGradebookProps: FeatureDataProps = {
  id: 'FormatCanvasGradebook',
  title: 'Format Canvas Gradebook',
  description: 'Format the exported Canvas Gradebook CSV file for uploading into Faculty Center\'s Grade Roster',
  ordinality: 2,
  roles: [RoleEnum.Teacher, RoleEnum.TA, ...adminRoles],
  helpURLEnding: '/gradebook-canvas.html'
}

const formatThirdPartyGradebookProps: FeatureDataProps = {
  id: 'FormatThirdPartyGradebook',
  title: 'Format Third\u2011Party Gradebook',
  description: 'Format a CSV file exported from an external tool for importing grades into the Canvas Gradebook',
  ordinality: 3,
  roles: [RoleEnum.Teacher, RoleEnum.TA, ...adminRoles],
  helpURLEnding: '/gradebook-thirdparty.html'
}

const createSectionsProps: FeatureDataProps = {
  id: 'CreateSections',
  title: 'Create Sections',
  description: 'Create sections through a CSV file in your course',
  ordinality: 4,
  roles: adminRoles,
  helpURLEnding: '/create-sections.html'
}

const addUMUsersProps: FeatureDataProps = {
  id: 'addUMUsers',
  title: 'Add U\u2011M Users',
  description: 'Add U\u2011M users to your available sections',
  ordinality: 5,
  roles: adminRoles,
  helpURLEnding: '/add-um-users.html'
}

const addNonUMUsersProps: FeatureDataProps = {
  id: 'addNonUMUsers',
  title: 'Add Non\u2011UM Users',
  description: 'Enroll non\u2011UM users to your available sections',
  ordinality: 6,
  roles: [RoleEnum.Teacher, RoleEnum['Subaccount admin'], RoleEnum['Account Admin'], RoleEnum['Support Consultant'], RoleEnum.Assistant, RoleEnum['Tool installer'], RoleEnum.TA, RoleEnum.Designer],
  helpURLEnding: '/add-non-um-users.html'
}

export type { FeatureDataProps }
export {
  mergeSectionProps, formatCanvasGradebookProps, formatThirdPartyGradebookProps,
  createSectionsProps, addUMUsersProps, addNonUMUsersProps, courseRenameRoles, createSectionRoles, adminRoles
}
