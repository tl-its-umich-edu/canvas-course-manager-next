import React from 'react'
import { styled } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material'

import { FeatureUIProps } from '../models/FeatureUIData.js'

const PREFIX = 'FeatureCard'

const classes = {
  cardContent: `${PREFIX}-cardContent`,
  centered: `${PREFIX}-centered`,
  title: `${PREFIX}-title`,
  cardLink: `${PREFIX}-cardLink`
}

const StyledRouterLink = styled(RouterLink)((
  {
    theme
  }
) => ({
  [`& .${classes.cardContent}`]: {
    backgroundColor: '#FAFAFA',
    height: 200
  },

  [`& .${classes.centered}`]: {
    width: '100%'
  },

  [`& .${classes.title}`]: {
    fontSize: 14
  },

  [`&.${classes.cardLink}`]: {
    textDecoration: 'none'
  },

  // Focus-visible ring instead of a darkened background (darkening reduces text contrast further)
  '& .MuiCardActionArea-root.Mui-focusVisible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '-3px'
  },
  '& .MuiCardActionArea-root.Mui-focusVisible .MuiCardActionArea-focusHighlight': {
    opacity: '0 !important'
  }
}))

function FeatureCard (props: FeatureUIProps): JSX.Element {
  return (
    <StyledRouterLink className={classes.cardLink} to={props.route} tabIndex={-1}>
      <Card variant='outlined'>
        <CardActionArea>
          <CardContent className={`${classes.cardContent}`}>
            <Grid container>
              <Grid item xs={12}>
                <div className={classes.centered}>
                  {props.icon}
                </div>
                <div className={classes.centered}>
                  <Typography className={classes.title} color='textPrimary' gutterBottom>
                    {props.data.title}
                  </Typography>
                  {/* Darker gray than the default textSecondary to meet 4.5:1 contrast on the #FAFAFA tile background */}
                  <Typography variant='body2' sx={{ color: '#595959' }}>
                    {props.data.description}
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </CardActionArea>
      </Card>
    </StyledRouterLink>
  )
}

export default FeatureCard
