import React, { ChangeEvent, useRef } from 'react'
import { Button, Card, CardContent, makeStyles, Typography } from '@material-ui/core'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import { useSnackbar } from 'notistack'

interface FileUploadProps {
  onUploadComplete: (file: File) => void
}

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'center'
  },
  cardContent: {
    cursor: 'pointer'
  },
  actionsBar: {
    backgroundColor: '#EEEEEE'
  },
  actionsBarIcon: {
    verticalAlign: 'middle'
  },
  input: {

  },
  uploadIcon: {
    color: '#3F648E'
  }
}))

function FileUpload (props: FileUploadProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const handleFileSelected = (file: File|undefined): void => {
    if (file === undefined) return
    if (file.name.toUpperCase().match(/.+.CSV/) == null) {
      enqueueSnackbar('File type not supported.', {
        variant: 'error'
      })
      return
    }
    props.onUploadComplete(file)
  }

  const dragover = (e: React.DragEvent): void => {
    e.preventDefault()
  }
  const dragdrop = (e: React.DragEvent): void => {
    e.preventDefault()
    handleFileSelected(e.dataTransfer.files[0])
  }
  const onFileInputClick = (): void => {
    fileInput.current?.click()
    console.log(fileInput)
  }

  const fileInput = useRef<HTMLInputElement | null>(null)
  const classes = useStyles()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target === null || event.target.files === null) return
    handleFileSelected(event.target.files[0])
  }

  return (
    <div className={classes.root}>
      <Card variant='outlined'>
        <CardContent className={classes.cardContent} onDragOver={dragover} onDrop={dragdrop} onClick={onFileInputClick}>
          <div>
            <CloudUploadIcon className={classes.uploadIcon} fontSize='large'/>
            <Typography>
              Drag and drop or <Button color='primary' component="span">browse your files</Button>
            </Typography>
            <input
              accept='.csv'
              className={classes.input}
              hidden
              ref={fileInput}
              id='fileInput'
              multiple={false}
              type='file'
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUpload
