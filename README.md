# Backstage Issues Sync Helper Extension

A Chrome extension that helps you to sync with [Backstage](https://github.com/backstage/backstage) Github issues!

This extension is meant to be used by maintainers of open-source Backstage project so they can open in the browser all the latest issues that were created or updated in a certain period. This extension requires that you authorize access to your GitHub account to read repos and organization data.

## Running locally

1. Clone the repo and change to project folder;

2. Create an .env file and put in the VITE_API_BASE_URL for your;

3. Install the dependendencis and build the project:
   ```sh
   yarn install
   yarn build --watch
   ```

4. Open the chrome://extensions page and enable the developer mode switch (at the top right corner of the page);

5. Click on "Load unpacked" and select the "dist" folder generated at the root of the extension folder;

6. Go to the "Extensions" menu in your browser and pin the Backstage Sync Helper extension.