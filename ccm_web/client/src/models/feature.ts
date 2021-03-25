
interface FeatureProps {
  id: string
  title: string
  description: string
  ordinality: number
  route: string
}

const mergeSectionProps: FeatureProps = {
  id: 'MergeSections',
  title: 'Merge Sections',
  description: 'Combine sections into one Canvas site for easier management',
  ordinality: 1,
  route: '/merge-sections'
}
const gradebookToolsProps: FeatureProps = {
  id: 'GradebookTools',
  title: 'Gradebook Tools',
  description: 'Trim the gradebook from Canvas, or trim the gradebook from a third party to correct format',
  ordinality: 2,
  route: '/gradebook'
}

const createSectionsProps: FeatureProps = {
  id: 'CreateSections',
  title: 'Create Sections',
  description: 'Create sections through csv files into your own course',
  ordinality: 3,
  route: '/create-sections'
}

const addUMUsersProps: FeatureProps = {
  id: 'addUMUsers',
  title: 'Add UM Users',
  description: 'Add UM users to your available sections',
  ordinality: 4,
  route: '/add-um-users'
}

const addNonUMUsersProps: FeatureProps = {
  id: 'addNonUMUsers',
  title: 'Add Non-UM Users',
  description: 'Enroll non-UM users to your available sections',
  ordinality: 5,
  route: '/add-non-um-users'
}

export type { FeatureProps }
export { mergeSectionProps, gradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps }
