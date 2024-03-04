import { ReactNode, createContext, useContext } from "react";
import { useAsyncRetry } from "react-use";
import { DateTime } from "luxon";
import { Octokit } from "@octokit/rest";
import {
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Layout } from "./Layout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class GithubClient {
  private octokit: Octokit;

  private constructor(options: { token: string }) {
    const { token: auth } = options;
    this.octokit = new Octokit({ auth });
  }

  static fromConfig(config: { token: string }) {
    return new GithubClient(config);
  }

  async listLabels() {
    if (!this.octokit) return;
    return await this.octokit.paginate(this.octokit?.issues.listLabelsForRepo, {
      owner: "backstage",
      repo: "backstage",
    });
  }

  async listIssues(
    params: {
      days?: number;
      since?: string;
      labels?: string;
    } = {}
  ) {
    if (!this.octokit) return;
    const { days = 3, since, labels } = params;

    let timestamp: string | undefined;

    if (since) {
      timestamp = since;
    } else {
      const date = DateTime.local();
      timestamp = date.minus({ days }).toISO();
    }

    const issues = await this.octokit.paginate(
      this.octokit.issues.listForRepo,
      {
        owner: "backstage",
        repo: "backstage",
        since: timestamp,
        ...(labels ? { labels } : {}),
        per_page: 10,
      }
    );

    return issues.filter(
      (issue) =>
        !issue.pull_request ||
        issue.labels.find(
          (label) =>
            (typeof label === "string" ? label : label.name) ===
            "needs discussion"
        )
    );
  }
}

const GithubContext = createContext<GithubClient | null>(null);

const useStyles = makeStyles({
  progress: {
    color: "#404040",
  },
});

export function GithubProvider({ children }: { children: ReactNode }) {
  const classes = useStyles();
  const { loading, value, retry } = useAsyncRetry(async () => {
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: `${API_BASE_URL}/login`,
      interactive: true,
    });

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }

    if (!responseUrl) return;

    const token = new URL(responseUrl).searchParams.get("token");

    if (!token) return;

    return GithubClient.fromConfig({ token });
  }, []);

  if (!value) {
    return (
      <Layout>
        {loading ? (
          <Grid
            className={classes.progress}
            container
            item
            xs={12}
            flexGrow={1}
            direction="column"
            justifyContent="center"
            alignItems="center"
          >
            <Stack spacing={2} alignItems="center">
              <Typography textAlign="center">Authenticating</Typography>
              <CircularProgress color="inherit" />
            </Stack>
          </Grid>
        ) : (
          <Snackbar
            open
            autoHideDuration={3000}
            message="Failed to authenticate"
            action={
              <Button color="inherit" onClick={retry}>
                Retry
              </Button>
            }
          />
        )}
      </Layout>
    );
  }

  return (
    <GithubContext.Provider value={value}>{children}</GithubContext.Provider>
  );
}

export function useClient() {
  return useContext(GithubContext);
}
