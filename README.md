# Meteor Google Cloud

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

A command line tool for deploying Meteor applications on Google Cloud App Engine Flexible.

## Installation

```bash
npm install meteor-google-cloud -g
 ```

## Deploying

To deploy to App Engine Flexible, follow the steps bellow:

### 1. Install gcloud CLI

```bash
Follow the guide on: https://cloud.google.com/sdk/install
```

### 2. Init Meteor Google Cloud

If this is the first time you deploy, you will need some specific files on your repo, run the command below to get them automatically generated.

```bash
meteor-google-cloud init
```

### 3. Set your App Engine Flexible settings

```bash
cd ./deploy
ls
Dockerfile	app.yml		settings.json
```

- Dockerfile: you can customize your Docker image, if you don't need to or don't know how to, you can either delete this fle or leave iit as is.
- app.yml: The settings and preferences of your App Engine service goes in here, check [Google's app.yml documentation](https://cloud.google.com/appengine/docs/standard/nodejs/config/appref) for full options.
- settings.json: This is your normal Meteor settings file, you will need to have the special key `meteor-google-cloud` for the deployment settings.
  - Required keys:
    - `project`: The project name of the project on Google Cloud to use.
  - Other keys: You can add any option you would like here, and they will be passed to `gcloud deploy app` command, for the full list, check [Google's gcloud deploy documentation](https://cloud.google.com/sdk/gcloud/reference/app/deploy).

### 4. Deploy

```bash
meteor-google-cloud --settings .deploy/config.json --app .deploy/app.yaml --docker .deploy/Dockerfile 
```

P.S: It may take a few minutes to build your app, which may appear to be unresponsive, but it's not, just wait.

## Support

We welcome any questions, contributions or bug reports in the GitHub [issue tracker](https://github.com/EducationLink/meteor-google-cloud/issues).

## License

[MIT](https://github.com/EducationLink/meteor-google-cloud/blob/master/LICENSE)
