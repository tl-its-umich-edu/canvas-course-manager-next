import { Backdrop, Box, Button, CircularProgress, createStyles, Grid, makeStyles, Paper, Step, StepLabel, Stepper, Theme, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import CloudDoneIcon from '@material-ui/icons/CloudDone'

import { getCourseSections } from '../api'
import BulkEnrollUMUserConfirmationTable, { IAddUMUser } from '../components/BulkEnrollUMUserConfirmationTable'
import CreateSectionWidget from '../components/CreateSectionWidget'
import ExampleFileDownloadHeader, { ExampleFileDownloadHeaderProps } from '../components/ExampleFileDownloadHeader'
import FileUpload from '../components/FileUpload'
import SectionSelectorWidget from '../components/SectionSelectorWidget'
import usePromise from '../hooks/usePromise'
import { CanvasCourseSection } from '../models/canvas'
import { addUMUsersProps } from '../models/feature'
import { CCMComponentProps } from '../models/FeatureUIData'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 25,
      textAlign: 'left'
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
      position: 'absolute'
    },
    confirmContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    fileNameContainer: {
      marginBottom: 15,
      paddingLeft: 10,
      paddingRight: 10,
      textAlign: 'left'
    },
    fileName: {
      color: '#3F648E',
      fontFamily: 'monospace'
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1)
    },
    createSetctionWidget: {
      width: '500px'
    },
    sectionSelectButton: {
      float: 'right'
    },
    sectionSelectionContainer: {

      position: 'relative',
      zIndex: 0,
      textAlign: 'center',
      minHeight: '300px',
      maxHeight: '400px'
    },
    stepper: {
      textAlign: 'center',
      paddingTop: '20px'
    },
    uploadContainer: {
      position: 'relative',
      zIndex: 0,
      textAlign: 'center'
    },
    dialog: {
      textAlign: 'center',
      marginBottom: 15,
      paddingLeft: 10,
      paddingRight: 10
    },
    table: {
      paddingLeft: 10,
      paddingRight: 10
    },
    dialogIcon: {
      color: '#3F648E'
    }
  })
)

interface AddUMUsersProps extends CCMComponentProps {}

function AddUMUsers (props: AddUMUsersProps): JSX.Element {
  const classes = useStyles()
  const [activeStep, setActiveStep] = useState(0)

  const [sections, setSections] = useState<CanvasCourseSection[]>([])
  const [file, setFile] = useState<File|undefined>(undefined)
  const [users, setUsers] = useState<IAddUMUser[]|undefined>(undefined)
  const [isAddingUsers, setIsAddingUsers] = useState<boolean>(false)

  const updateSections = (sections: CanvasCourseSection[]): void => {
    setSections(sections.sort((a, b) => { return a.name.localeCompare(b.name) }))
  }

  const [doLoadCanvasSectionData, isExistingSectionsLoading, getCanvasSectionDataError] = usePromise(
    async () => await getCourseSections(props.globals.course.id),
    (sections: CanvasCourseSection[]) => {
      updateSections(sections)
    }
  )

  useEffect(() => {
    void doLoadCanvasSectionData()
  }, [])

  useEffect(() => {
    if (file === undefined) {
      // ?
    } else {
      parseFile(file)
    }
  }, [file])

  const getSteps = (): string[] => {
    return ['Select', 'Upload', 'Review', 'Confirmation']
  }
  const steps = getSteps()

  const [selectedCourse, setSelectedCourse] = useState<CanvasCourseSection|undefined>(undefined)

  const sectionCreated = (newSection: CanvasCourseSection): void => {
    const newArray = sections.concat(newSection)
    console.log(newArray)
    updateSections(sections.concat(newSection))
  }

  interface IParseError {
    rowNumber: number
    error: string
  }

  const isValidRole = (role: string): boolean => {
    return true
  }

  const handleParseSuccess = (users: IAddUMUser[]): void => {
    console.log('handleParseSuccess')
    setUsers(users)
    setActiveStep(2)
  }

  const parseFile = (file: File): void => {
    console.log('parseFile')
    file.text().then(t => {
      let lines = t.split(/[\r\n]+/).map(line => { return line.trim() })
      // An empty file will resultin 1 line
      if (lines.length > 0 && lines[0].length === 0) {
        lines = lines.slice(1)
      }

      const headerParts = lines[0].split(',')
      if (headerParts.length !== 2) {
        console.log('Invalid header')
        return
      } else if ('ROLE'.localeCompare(headerParts[0]) !== 0 || 'UNIQNAME'.localeCompare(headerParts[1]) !== 0) {
        console.log('Invalid header')
        return
      }

      lines = lines.slice(1)

      const users: IAddUMUser[] = []
      const errors: IParseError[] = []
      lines.forEach((line, i) => {
        const parts = line.split(',')
        if (parts.length !== 2) {
          errors.push({ rowNumber: i + 1, error: 'Invalid column count' })
        } else {
          if (isValidRole(parts[0])) {
            users.push({ rowNumber: i + 1, uniqname: parts[1], role: parts[0] })
          } else {
            errors.push({ rowNumber: i + 1, error: `Invalid role '${parts[0]}'` })
          }
        }
      })

      handleParseSuccess(users)
    }).catch(e => {
      // TODO Not sure how to produce this error in real life
      console.log('error parsing file')
    })
  }

  const getSelectContent = (): JSX.Element => {
    return (
      <>
        <div className={classes.createSetctionWidget}><CreateSectionWidget {...props} onSectionCreated={sectionCreated}/></div>
        <Typography variant='subtitle1'>Or select one available section to add users</Typography>
        <div className={classes.sectionSelectionContainer}>
          <SectionSelectorWidget height={400} sections={sections !== undefined ? sections : []} selectionUpdated={setSelectedCourse}></SectionSelectorWidget>
          <div>
            <Button className={classes.sectionSelectButton} variant='contained' color='primary' disabled={selectedCourse === undefined} onClick={() => { setActiveStep(activeStep + 1) }}>Select</Button>
          </div>
          <Backdrop className={classes.backdrop} open={isExistingSectionsLoading}>
            <Grid container>
              <Grid item xs={12}>
                <CircularProgress color="inherit" />
              </Grid>
              <Grid item xs={12}>
                Loading sections
              </Grid>
            </Grid>
          </Backdrop>
        </div>
      </>
    )
  }

  const renderUploadHeader = (): JSX.Element => {
    const fileData =
`ROLE,UNIQNAME
student,studenta
teacher,usera
ta,userb
observer,userc
designer,userd`
    const fileDownloadHeaderProps: ExampleFileDownloadHeaderProps = {
      bodyText: "Your file should include the user's uniquname and their role",
      fileData: fileData,
      fileName: 'bulk_enroll.csv',
      linkText: 'Download an example',
      titleText: 'Upload your CSV File'
    }
    return (<ExampleFileDownloadHeader {...fileDownloadHeaderProps} />)
  }

  const uploadComplete = (file: File): void => {
    setFile(file)
  }

  const renderFileUpload = (): JSX.Element => {
    return <div className={classes.uploadContainer}>
      <Grid container>
        <Grid item xs={12}>
          <FileUpload onUploadComplete={uploadComplete}></FileUpload>
        </Grid>
      </Grid>
      {/* <Backdrop className={classes.backdrop} open={isExistingSectionsLoading}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
          {renderLoadingText()}
          </Grid>
        </Grid>
      </Backdrop> */}
    </div>
  }

  const getUploadContent = (): JSX.Element => {
    return (
    <div>
      {renderUploadHeader()}
      <br/>
      {renderFileUpload()}
    </div>
    )
  }

  const getReviewContent = (): JSX.Element => {
    if (users !== undefined) {
      return (renderConfirm(users))
    } else {
      return (<div>Error</div>)
    }
  }

  const renderCSVFileName = (): JSX.Element => {
    if (file !== undefined) {
      return (
        <h5 className={classes.fileNameContainer}>
          <Typography component='span'>File: </Typography><Typography component='span' className={classes.fileName}>{file.name}</Typography>
        </h5>
      )
    } else {
      return <></>
    }
  }

  const renderConfirm = (users: IAddUMUser[]): JSX.Element => {
    return (
      <div className={classes.confirmContainer}>
        {renderCSVFileName()}
        <Grid container>
          <Box clone order={{ xs: 2, sm: 1 }}>
            <Grid item xs={12} sm={9} className={classes.table}>
              <BulkEnrollUMUserConfirmationTable users={users} />
            </Grid>
          </Box>
          <Box clone order={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={3} className={classes.dialog}>
              <Paper role='status'>
                <Typography>Review your CSV file</Typography>
                <CloudDoneIcon className={classes.dialogIcon} fontSize='large'/>
                <Typography>Your file is valid!  If this looks correct, click &quot;Submit&quot; to proceed.</Typography>
                <Button variant="outlined" >Cancel</Button>
                <Button variant="outlined" >Submit</Button>
              </Paper>
            </Grid>
          </Box>
        </Grid>
        <Backdrop className={classes.backdrop} open={isAddingUsers}>
        <Grid container>
          <Grid item xs={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid item xs={12}>
          Loading...
          </Grid>
        </Grid>
      </Backdrop>
      </div>)
  }

  const getConfimationContent = (): JSX.Element => {
    return (
    <div>
      <BulkEnrollUMUserConfirmationTable users={users ?? []}/>
    </div>)
  }

  const getStepContent = (stepIndex: number): JSX.Element => {
    switch (stepIndex) {
      case 0:
        return getSelectContent()
      case 1:
        return getUploadContent()
      case 2:
        return getReviewContent()
      default:
        return getConfimationContent()
    }
  }

  const handleNext = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = (): void => {
    setActiveStep(0)
  }

  return (
    <>
      <div className={classes.root}>
        <Typography variant='h5'>{addUMUsersProps.title}</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {activeStep === steps.length
            ? (
                <div>
                  <Typography className={classes.instructions}>All steps completed</Typography>
                  <Button onClick={handleReset}>Reset</Button>
                </div>
              )
            : (
                <div>
                  {getStepContent(activeStep)}
                  {/* <div className={classes.stepper}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      className={classes.backButton}
                    >
                      Back
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleNext}>
                      {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                  </div> */}
                </div>
              )}
        </div>
      </div>
    </>
  )
}

export default AddUMUsers
