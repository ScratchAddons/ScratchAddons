# Contributing guidelines

Whether you want to send us feedback, fix a problem, create a new addon, or something else, feel free to contribute! Our code is open source.

You can learn more about the types of contributions you can make [here](https://scratchaddons.com/docs/faq/#contributing).

Be sure to follow our [code of conduct](https://github.com/ScratchAddons/ScratchAddons/blob/master/.github/CODE_OF_CONDUCT.md).

## Reporting bugs and suggesting features

Found a bug? Have an idea? You can open an [issue](https://github.com/ScratchAddons/ScratchAddons/issues) to report bugs and send feedback! But first, be sure to [search for existing issues](https://github.com/ScratchAddons/ScratchAddons/issues). If there are no similar issues, you can create a new one. We will take a look at it.

You can also open a [discussion](https://github.com/ScratchAddons/ScratchAddons/discussions) to suggest ideas or ask questions.

## Contributing code

If you are familiar with JavaScript, HTML, and CSS, you can contribute by fixing bugs, making adjustments, or adding features. Just follow the steps below to open a pull request to propose your changes which we can then add to Scratch Addons.

### Learn more about making addons

If you're making a new addon, our ["Creating an Addon" guide](https://scratchaddons.com/docs/develop/getting-started/creating-an-addon/) will teach you how to make one.

### Opening a pull request

We recommend [using Git](https://docs.github.com/en/get-started/quickstart/set-up-git) to commit changes. If you prefer GUIs, you can also [set up GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/installing-and-authenticating-to-github-desktop/setting-up-github-desktop). If you don't want to install anything, you can use the GitHub website, but we strongly recommend one of the other options to speed up the process.

New to contributing? You can practice by contributing to [octocat/Spoon-Knife](https://github.com/octocat/Spoon-Knife) with the help of [this guide](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).

We format our code with Prettier, which makes sure all code follows the same style and makes it look nice and neat. You can install [Prettier for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) or enable the "Format code using Prettier" workflow on your fork to have Prettier format your code.

Make sure you have thoroughly tested any changes you want to contribute.

1. **If you have something in mind, want to report a bug, or anything else, it's best if you create or find an issue first (see above). That way, we can discuss it before you start a pull request.**
2. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) this repository if you haven't already.
3. [Clone your fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) and [load it into your browser](https://scratchaddons.com/docs/getting-started/installing/#from-source) so you can make and test your changes. If you've already cloned your fork, remember to [pull down any changes](https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository#fetching-changes-from-a-remote-repository) to make sure you're up to date.
4. [Create a new branch](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#creating-a-branch-to-work-on), specifying `upstream/master` as the source branch:
  ```shell
  git checkout -b BRANCH-NAME upstream/master
  ```
  Branching makes things easier later on if you have multiple pull requests open at once or ever want to contribute again. You can always delete a branch.

5. [Commit and push](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-and-pushing-changes) your changes to your new branch.
6. Go to the website to [create a pull request](https://github.com/ScratchAddons/ScratchAddons/compare) on the origin repository (ScratchAddons/ScratchAddons). There should be a notification giving you a shortcut to open a pull request. (If you don't see it, you can manually open a pull request by clicking "New pull request", then "Compare across forks" and selecting your fork and branch next to "head repository". Then click "Create pull request" to go to the next step.)
7. Finally, fill out the form and click "Create pull request"! We will review your changes and talk about any further improvements if necessary.
