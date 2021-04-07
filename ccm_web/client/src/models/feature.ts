
interface FeatureDataProps {
  id: string
  title: string
  description: string
  ordinality: number
}

const mergeSectionProps: FeatureDataProps = {
  id: 'MergeSections',
  title: 'Merge Sections',
  description: 'Combine sections into one Canvas site for easier management',
  ordinality: 1
}

const canvasGradebookToolsProps: FeatureDataProps = {
  id: 'CanvasGradebookTools',
  title: 'Canvas Gradebook',
  description: 'Trim the gradebook from Canvas',
  ordinality: 2
}

const thirdPartygradebookToolsProps: FeatureDataProps = {
  id: 'ThirdPartyGradebookTools',
  title: 'Third Party Gradebook',
  description: 'Trim the gradebook from a third party to correct format',
  ordinality: 2
}

const createSectionsProps: FeatureDataProps = {
  id: 'CreateSections',
  title: 'Create Sections',
  description: 'Create sections through csv files into your own course',
  ordinality: 3
}

const addUMUsersProps: FeatureDataProps = {
  id: 'addUMUsers',
  title: 'Add UM Users',
  description: 'Add UM users to your available sections',
  ordinality: 4
}

const addNonUMUsersProps: FeatureDataProps = {
  id: 'addNonUMUsers',
  title: 'Add Non-UM Users',
  description: 'Enroll non-UM users to your available sections',
  ordinality: 5
}

export type { FeatureDataProps }
export { mergeSectionProps, canvasGradebookToolsProps, thirdPartygradebookToolsProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps }
