import { ReactNode } from "react";
import { Grid, Typography, Box, Stack } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import Logo from "./Logo.svg";

const useStyles = makeStyles({
  root: {
    background:
      "linear-gradient(148deg , #FFFFFF 58%, rgba(155,240,225,1) 78%, #36BAA2 92%)",
  },
  image: {
    display: "block",
    maxWidth: 100,
  },
});

export function Layout(props: { children?: ReactNode }) {
  const { children } = props;
  const classes = useStyles();

  return (
    <Box className={classes.root} p={2}>
      <Grid
        container
        spacing={3}
        direction="column"
        justifyContent="space-between"
        minWidth={400}
        minHeight={450}
      >
        <Grid item xs={12}>
          <Stack spacing={2} alignItems="center">
            <img className={classes.image} src={Logo} alt="Backstage logo" />
            <Typography variant="h5" textAlign="center" gutterBottom>
              Github Sync Helper
            </Typography>
          </Stack>
        </Grid>
        {children ?? null}
      </Grid>
    </Box>
  );
}
