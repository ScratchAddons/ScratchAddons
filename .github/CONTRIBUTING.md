# Contributing guidelines

Whether you want to send us feedback, fix a problem, create a new addon, or something else, you are welcome to contribute! Our code is open source.

You can learn more about the types of contributions you can make [here](https://scratchaddons.com/docs/faq/#contributing).

Be sure to follow our [code of conduct](https://github.com/ScratchAddons/ScratchAddons/blob/master/.github/CODE_OF_CONDUCT.md).

## Reporting bugs and suggesting features

Found a bug? Have an idea? You can [open an issue](https://github.com/ScratchAddons/ScratchAddons/issues/new/choose) to report bugs and send feedback! But first, be sure to [search for existing issues](https://github.com/ScratchAddons/ScratchAddons/issues). If there are no similar issues, you can create a new one. You can also open a [discussion](https://github.com/ScratchAddons/ScratchAddons/discussions) to suggest ideas or ask questions. We will take a look at it.

We also have a [feedback form](https://scratchaddons.com/feedback) on our website, which you can access by clicking "Send Feedback" in Scratch Addons' full screen settings page.

## Contributing code

If you are familiar with JavaScript, HTML, and CSS, you can contribute by fixing bugs or adding features. Just follow the steps below to propose your changes which we can then add to Scratch Addons.

### Learn more about making addons

If you're making your first new addon, follow our ["Creating an Addon" guide](https://scratchaddons.com/docs/develop/getting-started/creating-an-addon/).

Check our [reference](https://scratchaddons.com/docs/reference/) for details about our APIs and addon manifest structure.

### Getting set up to contribute

We recommend [using Git](https://docs.github.com/en/get-started/quickstart/set-up-git) to commit changes. If you prefer GUIs, you can also [set up GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/installing-and-authenticating-to-github-desktop/setting-up-github-desktop). If you don't want to install anything, you can use the GitHub website, but we strongly recommend one of the other options to speed up the process.

In order to fork the repository and open a pull request, you'll need a GitHub account.

New to contributing? [octocat/Spoon-Knife](https://github.com/octocat/Spoon-Knife) and [this guide](https://docs.github.com/en/get-started/quickstart/contributing-to-projects) are good resources to learn the process.

Looking for a code editor? We recommend [Visual Studio Code](https://code.visualstudio.com/).

Testing changes once you have downloaded the source code is very easy and you don't need any additional software to do so. See how to run the source code for Scratch Addons in our [documentation](https://scratchaddons.com/docs/getting-started/installing/#installing-on-google-chrome-or-microsoft-edge).

### Guidelines and tips

We format our code with Prettier to make sure all of it follows the same style and looks nice and neat. You can install [Prettier for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) or enable the "Format code using Prettier" workflow on your fork (by going to the Actions tab) to have Prettier format your code. If your pull request has formatting issues and you don't have Prettier, don't worry, we can fix it for you.

It's a good idea to check "allow edits from maintainers" so that we can make adjustments and help fix things (like formatting) for you.

If you're working on changes and something looks outdated, [sync your branch with the upstream repository](https://docs.github.com/en/get-started/using-git/getting-changes-from-a-remote-repository#fetching-changes-from-a-remote-repository) to make sure you're all caught up.

**Make sure you have thoroughly tested any changes you want to contribute.**

### Opening a pull request

1. **If you have something in mind, it's best if you create or find an issue first (see above). That way, we can discuss it before you start a pull request.**
2. [Fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) if you haven't already.
3. [Clone your fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo#cloning-your-forked-repository) and [load it into your browser](https://scratchaddons.com/docs/getting-started/installing/#installing-on-google-chrome-or-microsoft-edge) so you can make and test your changes.
4. [Create a new branch](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#creating-a-branch-to-work-on), specifying `upstream/master` as the source branch:
   ```shell
   git checkout -b BRANCH-NAME upstream/master
   ```
   Branching makes things easier later on if you have multiple pull requests open at once or ever want to contribute again. You can always delete a branch.
5. Make and test your changes.
6. [Commit and push](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-and-pushing-changes) your changes to the branch.
7. Go to the website to create a pull request in the source repository (ScratchAddons/ScratchAddons). There should be a banner with a button to open a pull request.
  ![Screenshot of the banner above the list of files.](https://github.com/github/docs/blob/78aee663ffc3f1f3eb1668efa0387e0febc97ede/assets/images/help/pull_requests/pull-request-compare-pull-request.png?raw=true)
  (If you don't see it, you can [manually open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) by navigating to the "Pull requests" tab, clicking "New pull request", then clicking "Compare across forks" and selecting your fork and branch next to "head repository". Then click "Create pull request" to go to the next step.)
8. Finally, fill out the form. Remember to check "allow edits from maintainers" in case we need to make adjustments. Once you're done, click "Create pull request"!

Once your pull request is open, we will review and discuss the changes and any necessary adjustments.
