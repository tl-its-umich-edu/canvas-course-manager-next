
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

const canvasGradebookFormatterProps: FeatureDataProps = {
  id: 'CanvasGradebookFormatter',
  title: 'Canvas Gradebook Formatter',
  description: 'Formats the exported Canvas Gradebook CSV file for uploading into Faculty Center\'s Grade Roster.',
  ordinality: 2
}

const ExternalToolsGradebookFormatterProps: FeatureDataProps = {
  id: 'ExternalToolsGradebookFormatter',
  title: 'External Tools Gradebook Formatter',
  description: 'Formats a CSV file exported from an external tool for importing grades into the Canvas Gradebook.',
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
export { mergeSectionProps, canvasGradebookFormatterProps, ExternalToolsGradebookFormatterProps, createSectionsProps, addUMUsersProps, addNonUMUsersProps }
