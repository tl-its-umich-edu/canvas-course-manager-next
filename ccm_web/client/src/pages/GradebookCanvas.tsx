import React, { useState } from 'react'
import { makeStyles, SvgIconProps, Typography } from '@material-ui/core'
import CloudDoneIcon from '@material-ui/icons/CloudDone'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty'
import { parse, ParseResult } from 'papaparse'
import { useSnackbar } from 'notistack'

import FileUpload, { FileUploadActionProps } from '../components/FileUpload'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 25,
    textAlign: 'left'
  },
  uploadIcon: {
    color: '#3F648E'
  },
  uploadErrorIcon: {
    color: 'red'
  }
}))

interface GradebookRecord {
  'Current Grade': string
  'Final Grade': string
  'SIS Login ID': string
  Student: string
}

interface GradebookInvalidation {
  message: string
}
class CurrentAndFinalGradeMismatchInvalidation implements GradebookInvalidation {
  message: string
  record: GradebookRecord
  constructor (record: GradebookRecord) {
    this.record = record
    this.message = 'Current and Final grade mismatch: ' + record.Student + '(' + record['SIS Login ID'] + ')'
  }
}

interface GradebookRecordValidator {
  validate: (record: GradebookRecord) => GradebookInvalidation[]
}
abstract class GradebookValidator implements GradebookRecordValidator {
  abstract validate: (record: GradebookRecord) => GradebookInvalidation[]
}
class CurrentAndFinalGradeMatchGradebookValidator extends GradebookValidator {
  validate = (record: GradebookRecord): GradebookInvalidation[] => {
    const invalidations: GradebookInvalidation[] = []
    if (record['Final Grade'] !== record['Current Grade']) {
      invalidations.push(new CurrentAndFinalGradeMismatchInvalidation(record))
    }
    return invalidations
  }
}

function ConvertCanvasGradebook (): JSX.Element {
  const classes = useStyles()

  const uploadNeutralIcon: React.ReactElement<SvgIconProps> =
  (<CloudUploadIcon className={classes.uploadIcon} fontSize='large'/>)

  const uploadValidIcon: React.ReactElement<SvgIconProps> =
  (<CloudDoneIcon className={classes.uploadIcon} fontSize='large'/>)

  const uploadErrorIcon: React.ReactElement<SvgIconProps> =
  (<CloudUploadIcon className={classes.uploadErrorIcon} fontSize='large'/>)

  const validatingIcon: React.ReactElement<SvgIconProps> =
  (<HourglassEmptyIcon className={classes.uploadIcon} fontSize='large'/>)

  const { enqueueSnackbar } = useSnackbar()
  const [text, setText] = useState('')// debugging
  const [fileUploadLabelText, setFileUploadLabelText] = useState(['Upload csv'])
  const [fileUploadAction, setFileUploadAction] = useState<FileUploadActionProps|undefined>(undefined)
  const [uploadIcon, setUploadIcon] = useState(uploadNeutralIcon)

  const uploadComplete = (file: File): void => {
    parseUpload(file)
  }

  const parseUpload = (file: File): void => {
    // This results in an error on the 2nd "header" row for possible scores
    handleValidating()
    parse<GradebookRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        handleParseComplete(results)
      }

    })
    setText(text)
  }

  const handleValidating = (): void => {
    setUploadIcon(validatingIcon)
    setFileUploadLabelText(['Validating...'])
    setFileUploadAction(undefined)
  }

  const handleError = (errorMessage: string[], actionText: string, actionUrl: URL): void => {
    enqueueSnackbar(errorMessage.join('  '), { variant: 'error' })
    setUploadIcon(uploadErrorIcon)
    setFileUploadLabelText(errorMessage)
    setFileUploadAction({ actionText: actionText, actionLink: actionUrl })
  }

  const handleParseSuccess = (): void => {
    setUploadIcon(uploadValidIcon)
    setFileUploadLabelText(['Your file is valid!', 'If this is the right file you want to upload click confirm'])
  }

  const handleParseComplete = (results: ParseResult<GradebookRecord>): void => {
    const data = results.data.slice(1) // The first row is possible scores

    if (data[0]['Final Grade'] === undefined) {
      // show message about the lack of grading scheme and Final Grade
      handleError(['Your file needs to include grade letter (A-E)', 'Change your grading scheme in settings'], 'More Info', new URL('http://documentation.its.umich.edu/node/401'))
      return
    }

    let invalidations: GradebookInvalidation[] = []

    const gradeMismatchValidator = new CurrentAndFinalGradeMatchGradebookValidator()

    data.forEach(record => {
      invalidations = invalidations.concat(gradeMismatchValidator.validate(record))
    })
    // }
    results.errors.forEach(error => {
      console.log('ERROR ' + error.message)
    })
    results.data.forEach(data => {
      console.log('DATA ' + data['SIS Login ID'] + ' ' + data['Current Grade'] + ' ' + data['Final Grade'])
    })

    handleParseSuccess()
  }

  return (
    <div className={classes.root}>
      <Typography variant='h5'>Convert Canvas Gradebook</Typography>
      <Typography>Upload your csv file</Typography>
      <FileUpload onUploadComplete={uploadComplete} labelText={fileUploadLabelText} action={fileUploadAction} primaryIcon={uploadIcon}></FileUpload>
      <div>{text}</div>
    </div>
  )
}

export default ConvertCanvasGradebook
