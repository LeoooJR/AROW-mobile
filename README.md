# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Prepare the railway reference assets

   ```bash
   npm run database:setup
   ```

   This explicit setup step downloads the pinned railway geometry, milestone
   GeoJSON, and kilometric-point CSV from the project's [public Google Drive
   folder](https://drive.google.com/drive/folders/1dRbp0vyVmZoOHnN9AQIbM4YXQ7HGADx2?usp=sharing).
   It validates their checksums and contents, normalizes the railway GeoJSON,
   and generates the SQLite database from the CSV. Rerunning the command
   atomically replaces the ignored `src/statics/lignes-par-type.geojson`,
   `src/statics/milestones.geojson`, and
   `src/statics/railway_reference.sqlite` application assets.

3. Start the app

   ```bash
   npm start
   ```

The start and test commands validate that all three railway reference assets are
present and structurally valid. If this check fails, rerun
`npm run database:setup`; the check never downloads or repairs assets itself.

Before running `eas build`, complete the same setup sequence locally. The EAS
upload includes the prepared railway assets, and the remote build validates
them before bundling the application.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Local Android end-to-end tests

The Maestro suite runs on the local host against the Android development
client. Maestro must be installed separately; it is not an npm dependency.

Prepare the application before running the suite:

1. Start an Android emulator, for example:

   ```bash
   android emulator start medium_phone
   ```

2. Install and open the development client once if it is not already installed:

   ```bash
   npx expo run:android
   ```

   For subsequent runs, start Metro on its default port and open the installed
   client with the repository helper:

   ```bash
   ./script/build_and_run.sh --android
   ```

3. In another terminal, run every Maestro journey:

   ```bash
   npm run test:e2e
   ```

When multiple devices are connected, address the emulator explicitly:

```bash
maestro --device emulator-5554 test .maestro
```

The local suite does not use Maestro Cloud or EAS Cloud.

The suite uses a goal-driven user-journey structure. Follow
[`.maestro/CONTEXT.md`](.maestro/CONTEXT.md) when maintaining or recording its
flows.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
