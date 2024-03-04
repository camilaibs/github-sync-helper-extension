import { useEffect, useState } from "react";
import { useAsync, useAsyncFn } from "react-use";
import { DateTime } from "luxon";
import {
  Autocomplete,
  Grid,
  TextField,
  Button,
  Snackbar,
  IconButton,
  LinearProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import makeStyles from "@mui/styles/makeStyles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useClient } from "./ClientProvider";
import { Layout } from "./Layout";

const useStyles = makeStyles({
  root: {
    background:
      "linear-gradient(144deg, #FFFFFF 48%, rgba(155,240,225,1) 69%, #36BAA2 92%)",
  },
  image: {
    display: "block",
    maxWidth: 100,
  },
  field: {
    background: "#FFFFFF",
  },
  button: {
    "&&": {
      color: "#121212",
      backgroundColor: "#36baa2",
      "&:hover": {
        color: "#121212",
        backgroundColor: "#36baa2",
      },
    },
  },
  progress: {
    color: "#404040",
  },
});

function App() {
  const classes = useStyles();

  const [open, setOpen] = useState(false);

  const [data, setData] = useState<{
    days?: number;
    since?: DateTime | null;
    labels?: { name: string }[];
    group?: boolean;
  }>({});

  const client = useClient();

  const [{ loading, error }, loadIssues] = useAsyncFn(async () => {
    if (!client) return;

    const params = {
      days: data.days,
      since: data.since?.toISO() ?? "",
      labels: data.labels?.map((label) => label.name).join(","),
      group: data.group,
    };

    await chrome.storage.sync.set(params);

    const issues = await client.listIssues(params);

    if (!issues?.length) {
      throw new Error("No issues found");
    }
    const groups: Record<string, { tabIds: number[]; id: number }> = {};

    const window = await chrome.windows.create();

    if (!window.id) return;

    for (const issue of issues) {
      const tab = await chrome.tabs.create({
        windowId: window.id,
        url: issue.html_url,
      });

      if (!data.group) continue;

      const labels = issue.labels.map((label) =>
        typeof label === "string" ? label : label.name
      );

      const groupName =
        labels.find((label) => label?.startsWith("area:")) ?? "Other";

      const tabIds = groups[groupName]?.tabIds ?? [];

      const newTabIds = tab.id ? tabIds.concat(tab.id) : tabIds;

      const groupId = await chrome.tabs.group(
        groups[groupName]?.id
          ? { groupId: groups[groupName].id, tabIds: newTabIds }
          : {
              createProperties: { windowId: window.id },
              tabIds: newTabIds,
            }
      );

      groups[groupName] = {
        tabIds: newTabIds,
        id: groupId,
      };

      await chrome.tabGroups.update(groupId, {
        title: groupName,
        collapsed: true,
      });
    }

    await chrome.windows.update(window.id, { focused: true });
  }, [client, data]);

  const labels = useAsync(async () => {
    if (!client) return;
    return await client.listLabels();
  }, [client]);

  const initialData = useAsync(async () => {
    const params = await chrome.storage.sync.get([
      "labels",
      "days",
      "since",
      "group",
    ]);

    const { days = 3, since, labels, group = false } = params;

    setData({
      days,
      since: since ? DateTime.fromISO(since) : null,
      labels: labels ? labels.split(",").map((name: string) => ({ name })) : [],
      group,
    });
  }, [setData]);

  useEffect(() => {
    setOpen(Boolean(error));
  }, [error, setOpen]);

  if (!client || initialData.loading) {
    return null;
  }

  return (
    <Layout>
      {loading && (
        <Grid item xs={12} className={classes.progress}>
          <LinearProgress color="inherit" />
        </Grid>
      )}
      <Grid container item spacing={3} direction="column">
        <Grid item xs={12}>
          <Autocomplete
            size="small"
            value={data.labels}
            loading={labels.loading}
            options={labels.value ?? []}
            getOptionLabel={(option) => option.name}
            onChange={(_event, value) => {
              setData((rest) => ({ ...rest, labels: value }));
            }}
            renderInput={({ InputProps, ...rest }) => (
              <TextField
                {...rest}
                label="Labels"
                InputProps={{
                  ...InputProps,
                  className: `${InputProps.className} ${classes.field}`,
                }}
              />
            )}
            disabled={loading}
            multiple
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            type="number"
            size="small"
            label="Days"
            value={data.days}
            onChange={(event) => {
              setData((rest) => ({
                ...rest,
                days: Number(event.target.value),
              }));
            }}
            disabled={loading}
            inputProps={{ min: 1, max: 60 }}
            InputProps={{ className: classes.field }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <DatePicker
            label="Since"
            value={data.since}
            onChange={(value) => {
              setData((rest) => ({ ...rest, since: value }));
            }}
            openTo="day"
            format="yyyy-MM-dd"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                InputProps: { className: classes.field },
              },
              field: {
                clearable: true,
                onClear: () => {
                  setData((rest) => ({ ...rest, since: null }));
                },
              },
            }}
            disabled={loading}
            disableOpenPicker
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            label="Group by area label"
            control={
              <Checkbox
                color="default"
                checked={data.group}
                onChange={(event) => {
                  setData((rest) => ({ ...rest, group: event.target.checked }));
                }}
              />
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            classes={{ root: classes.button }}
            variant="contained"
            onClick={loadIssues}
            disabled={loading}
            fullWidth
          >
            Load issues
          </Button>
        </Grid>
      </Grid>
      {error && (
        <Snackbar
          open={open}
          autoHideDuration={3000}
          message={error?.message}
          onClose={() => setOpen(false)}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      )}
    </Layout>
  );
}

export default App;
