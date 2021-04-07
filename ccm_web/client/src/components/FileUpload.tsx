import React, { useRef } from 'react'
import { Button, Card, CardActions, CardContent, Link, makeStyles, SvgIconProps, Typography } from '@material-ui/core'
import ForwardIcon from '@material-ui/icons/Forward'

interface FileUploadActionProps {
  actionText: string
  actionLink: URL
}

interface FileUploadProps {
  labelText: string[]
  action: FileUploadActionProps|undefined
  onUploadComplete: (file: File) => void
  primaryIcon: React.ReactElement<SvgIconProps>
}

const useStyles = makeStyles((theme) => ({
  root: {

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
            <div>
              {props.primaryIcon}
            </div>
            <input
              accept='.csv'
              className={classes.input}
              hidden
              ref={fileInput}
              id='fileInput'
              multiple
              type='file'
            />
            <div>
              <label htmlFor='fileInput'>
                {props.labelText.map(function (name, index) {
                  return <div key={ index }>{name}</div>
                })}
              </label>
            </div>
            <Button color='primary' component="span" onClick={onFileInputClick}>
                Upload
            </Button>
          </div>
        </CardContent>
        {props.action !== undefined &&
          <CardActions className={classes.actionsBar}>
              <Link href={props.action?.actionLink.href}><Typography>{props.action?.actionText}<ForwardIcon className={classes.actionsBarIcon} fontSize='inherit'></ForwardIcon></Typography></Link>
          </CardActions>
        }
      </Card>
    </div>
  )
}

export type { FileUploadActionProps }
export default FileUpload
