# Contributing guidelines

Whether you want to send us feedback, fix a problem, create a new addon, or something else, you are welcome to contribute! Our code is open source.

You can learn more about the types of contributions you can make [here](https://scratchaddons.com/docs/faq/#contributing).

Be sure to follow our [code of conduct](https://github.com/ScratchAddons/ScratchAddons/blob/master/.github/CODE_OF_CONDUCT.md).

## Reporting bugs and suggesting features

Found a bug? Have an idea? You can [open an issue](https://github.com/ScratchAddons/ScratchAddons/issues/new/choose) to report bugs and send feedback! But first, be sure to [search for existing issues](https://github.com/ScratchAddons/ScratchAddons/issues). If there are no similar issues, you can create a new one. We will take a look at it.

You can also open a [discussion](https://github.com/ScratchAddons/ScratchAddons/discussions) to suggest ideas or ask questions. We also have a [feedback form](https://scratchaddons.com/feedback) on our website.

## Contributing code

If you are familiar with JavaScript, HTML, and CSS, you can contribute by fixing bugs or adding features. Just follow the steps below to propose your changes which we can then add to Scratch Addons.

### Learn more about making addons

If you're making a new addon, our ["Creating an Addon" guide](https://scratchaddons.com/docs/develop/getting-started/creating-an-addon/) will teach you how to make one.

### Getting set up to contribute

We recommend [using Git](https://docs.github.com/en/get-started/quickstart/set-up-git) to commit changes. If you prefer GUIs, you can also [set up GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/installing-and-authenticating-to-github-desktop/setting-up-github-desktop). If you don't want to install anything, you can use the GitHub website, but we strongly recommend one of the other options to speed up the process.

In order to fork the repository and open a pull request, you'll need a GitHub account.

New to contributing? [octocat/Spoon-Knife](https://github.com/octocat/Spoon-Knife) and [this guide](https://docs.github.com/en/get-started/quickstart/contributing-to-projects) are good resources to practice.

Looking for a code editor? We recommend [Visual Studio Code](https://code.visualstudio.com/).

### Guidelines and tips

We format our code with Prettier to make sure all of it follows the same style and look nice and neat. You can install [Prettier for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) or enable the "Format code using Prettier" workflow on your fork (by going to the Actions tab) to have Prettier format your code. If your pull request has formatting issues and you don't have Prettier, don't worry, we can fix it for you.

It's a good idea to check "allow edits from maintainers" so that we can make adjustments and help fix things (like formatting) for you. This might read "allow edits and **access to secrets** from maintainers" and [that's okay](https://github.com/DNin01/help-for-github-users/blob/main/questions/allowing-edits-and-access-to-secrets.md).

If you're working on changes and something looks outdated, [sync your branch with the upstream repository](https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository#fetching-changes-from-a-remote-repository) to make sure you're all caught up.

**Make sure you have thoroughly tested any changes you want to contribute.**

### Opening a pull request

1. **If you have something in mind, want to report a bug, or anything else, it's best if you create or find an issue first (see above). That way, we can discuss it before you start a pull request.**
2. [Fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) if you haven't already.
3. [Clone your fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) and [load it into your browser](https://scratchaddons.com/docs/getting-started/installing/#from-source) so you can make and test your changes.
4. [Create a new branch](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#creating-a-branch-to-work-on), specifying `upstream/master` as the source branch:
  ```shell
  git checkout -b BRANCH-NAME upstream/master
  ```
  Branching makes things easier later on if you have multiple pull requests open at once or ever want to contribute again. You can always delete a branch.

5. Make and test your changes.
6. [Commit and push](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-and-pushing-changes) your changes to the branch.
7. Go to the website to create a pull request in the source repository (ScratchAddons/ScratchAddons). There should be a banner with a button to open a pull request.
  ![Screenshot of the banner above the list of files.](https://docs.github.com/assets/cb-34106/mw-1440/images/help/pull_requests/pull-request-compare-pull-request.webp)
  (If you don't see it, you can [manually open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) by navigating to the "Pull requests" tab, then clicking "New pull request", then clicking the "Compare across forks" link and selecting your fork and branch next to "head repository". Then click "Create pull request" to go to the next step.)
8. Finally, fill out the form. Remember to check "allow edits from maintainers" in case we need to make adjustments. Once you're done, click "Create pull request"!

Once your pull request is open, we will review and discuss the changes and any necessary adjustments.
