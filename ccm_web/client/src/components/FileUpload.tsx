import React, { useRef } from 'react'
import { Button, Card, CardContent, makeStyles, Typography } from '@material-ui/core'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'

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
  const dragover = (e: React.DragEvent): void => {
    e.preventDefault()
  }
  const dragdrop = (e: React.DragEvent): void => {
    e.preventDefault()
    props.onUploadComplete(e.dataTransfer.files[0])
  }
  const onFileInputClick = (): void => {
    fileInput.current?.click()
  }

  const fileInput = useRef<HTMLInputElement | null>(null)
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Card variant='outlined'>
        <CardContent className={classes.cardContent} onDragOver={dragover} onDrop={dragdrop} onClick={onFileInputClick}>
          <div>
            <CloudUploadIcon className={classes.uploadIcon} fontSize='large'/>
            <Typography>
              Drag and drop or <Button color='primary' component="span" onClick={onFileInputClick}>browse your files</Button>
            </Typography>
            <input
              accept='.csv'
              className={classes.input}
              hidden
              ref={fileInput}
              id='fileInput'
              multiple={false}
              type='file'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUpload
