import React, { ChangeEvent, useRef } from 'react'
import { styled } from '@mui/material/styles'
import { Button, Card, CardContent, Typography } from '@mui/material'
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'

const PREFIX = 'FileUpload'

const classes = {
  root: `${PREFIX}-root`,
  cardContent: `${PREFIX}-cardContent`,
  actionsBar: `${PREFIX}-actionsBar`,
  actionsBarIcon: `${PREFIX}-actionsBarIcon`,
  input: `${PREFIX}-input`,
  uploadIcon: `${PREFIX}-uploadIcon`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center'
  },

  [`& .${classes.cardContent}`]: {
    cursor: 'pointer',
    height: 250,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },

  [`& .${classes.actionsBar}`]: {
    backgroundColor: '#EEEEEE'
  },

  [`& .${classes.actionsBarIcon}`]: {
    verticalAlign: 'middle'
  },

  [`& .${classes.input}`]: {

  },

  [`& .${classes.uploadIcon}`]: {
    color: theme.palette.info.main
  }
}))

interface FileUploadProps {
  onUploadComplete: (file: File) => void
}

function FileUpload (props: FileUploadProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar()
  const handleFileSelected = (file: File|undefined): void => {
    if (file === undefined) return
    if (file.name.toUpperCase().match(/.+.CSV/) == null) {
      enqueueSnackbar('Only .csv files are supported', {
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
  const onFileInputClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    fileInput.current?.click()
    e.stopPropagation()
  }

  const fileInput = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target === null || event.target.files === null) return
    handleFileSelected(event.target.files[0])
  }

  return (
    <Root className={classes.root}>
      <Card variant='outlined'>
        <CardContent className={classes.cardContent} onDragOver={dragover} onDrop={dragdrop} onClick={(e) => onFileInputClick(e)}>
          <div>
            <CloudUploadIcon className={classes.uploadIcon} fontSize='large'/>
            <Typography>
              Drag and drop or <Button color='primary' component="span" onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => onFileInputClick(e)}>browse your files</Button>
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
    </Root>
  )
}

export default FileUpload
