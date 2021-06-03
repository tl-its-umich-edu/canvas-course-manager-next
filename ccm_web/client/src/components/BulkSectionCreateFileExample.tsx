import React from 'react'
import { FILE_HEADER_VALUE } from './BulkSectionCreateValidators'

interface BulkSectionCreateFileExampleProps {
  sectionName: string
  sectionCount: number
}

function BulkSectionCreateFileExample (props: BulkSectionCreateFileExampleProps): JSX.Element {
  const sectionNames: string[] = []
  for (let i = 0; i < props.sectionCount; ++i) {
    sectionNames.push(props.sectionName + ' Section ' + (i + 1).toString().padStart(3, '0'))
  }
  return (
    <div>
      <div>{FILE_HEADER_VALUE}</div>
      {sectionNames.map((n, i) => {
        return <div key={i}>{n}</div>
      })}
    </div>
  )
}

export type { BulkSectionCreateFileExampleProps }
export default BulkSectionCreateFileExample
