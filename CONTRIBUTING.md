# Contributing to Forumactif Messenger
Forumactif Messenger is an open source project, which means that you can help improve it ! There are plenty of ways that you can help contribute to Forumactif Messenger, from submitting bug reports to writing code that can be incorporated into the project itself. We greatly appreciate all contributions and want to thank you personally for taking the time to read over this file !

**Table of Contents**
- [Bug Reports](#bug-reports)
- [Feature Requests and Suggestions](#feature-requests-and-suggestions)
- [Contributing Code Changes](#contributing-code-changes)
- [Contributing a Theme](#contributing-a-theme)
- [Questions](#questions)

---

## Bug Reports
Forumactif Messenger isn't perfect, so sometimes you may run into a bug or something unexpected. If this ever happens it's recommended that you report the issue so that it can be investigated and fixed.

### Where to report your bug
There are a few ways to report a bug, choose your preferred method below. You can report your bug on...
- Github by opening a [new issue](https://github.com/SethClydesdale/forumactif-messenger/issues). If you don't have a Github account [you can create one](https://github.com/join). (It's free!)
- The [English Support Forum](http://help.forumotion.com/t152951-forumactif-messenger-instant-message-application-for-forumotion#1047237) for Forumotion. You will have to [register an account](http://help.forumotion.com/register) on the forum. If you cannot view the linked topic, send your bug report via PM to [Ange Tuteur](http://help.forumotion.com/privmsg?mode=post&u=88576).

### What to include in your report
If possible, please include the following information in your bug report.
- The URL to your Forum (this is required for debugging and identifying your forum version)
- Description of your issue.
- Steps to reproduce the issue. (optional)

Sometimes sending a specific message causes an error, preventing the message from being sent. If this occurs for you, even after resending multiple times, please provide the ENTIRE text for the message so that it can be reviewed to figure out what caused the error. Your message will be available in textarea : 

[![](https://i58.servimg.com/u/f58/18/21/41/30/captur52.png)](https://i58.servimg.com/u/f58/18/21/41/30/captur52.png)

Once your bug report is submitted all you need to do is sit back and wait for us to reply. We'll no doubt need to discuss the issue with you and if necessary ask for more information on the bug, but regardless we'll squash the bug with your help !

---

## Feature Requests and Suggestions
Forumactif Messenger is constantly evolving and it's largely in part thanks to the suggestions from the community -- you ! If you have a suggestion for a new feature or improvement we'd love to hear it !

### Where to leave your suggestion
There are a few ways to suggest new features, choose your preferred method below. You can leave your suggestion on...
- Github by opening a [new issue](https://github.com/SethClydesdale/forumactif-messenger/issues). If you don't have a Github account [you can create one](https://github.com/join). (It's free!)
- The [English Support Forum](http://help.forumotion.com/t152951-forumactif-messenger-instant-message-application-for-forumotion#1047237) for Forumotion. You will have to [register an account](http://help.forumotion.com/register) on the forum. If you cannot view the linked topic, send your bug report via PM to [Ange Tuteur](http://help.forumotion.com/privmsg?mode=post&u=88576).

### What to include in your suggestion
If possible, please include the following information in your suggestion.
- Detailed description of the feature or improvement you're suggesting.
- An image or example of the feature or improvement to help further convey your suggestion. (optional)

Once your suggestion is submitted all you need to do is sit back and wait for us to reply. We'll gladly discuss your suggestion with you and if necessary ask for more information to help us get a better picture of your vision.

---

## Contributing Code Changes
If you have a new feature or fix that you'd like to contribute to Forumactif Messenger, please [find or open an issue](https://github.com/SethClydesdale/forumactif-messenger/issues) about it first. Tell us about what you'd like to do. It may be that somebody is already working on it, or that there are particular issues that you should know about before implementing the change. We enjoy working with contributors to get their code accepted and there are many approaches to fixing a problem, so it's important to inquire before writing too much code.

### Fork and Clone the Repository
You will need to fork the main Forumactif Messenger repository and clone it to your desktop to contribute changes. See the [github help page](https://help.github.com/articles/fork-a-repo) for more information.

Further instructions for contributing are given below.

### Files to Modify
Forumactif Messenger is linked directly to the master branch, as such we must take care in the files we modify. Below is a list of files which you can contribute to without issue.

- [fam.css](https://github.com/SethClydesdale/forumactif-messenger/blob/master/fam.css) for proposing changes to Forumactif Messenger's design.
- [fam-dev.js](https://github.com/SethClydesdale/forumactif-messenger/blob/master/fam-dev.js) for proposing code changes to Forumactif Messenger.

See our [todo list](https://github.com/SethClydesdale/forumactif-messenger/wiki/Todo-List) for ideas and [open a new issue](https://github.com/SethClydesdale/forumactif-messenger/issues/new) for discussing changes you want to make to the above files. It's best to discuss things beforehand so everyone is on the same page.

#### Files to be careful when Modifying
The files below will affect production when pushed to the master branch, so be sure to discuss your changes with the community before modifying them.

- [fam.js](https://github.com/SethClydesdale/forumactif-messenger/blob/master/fam.js) should only be updated when a new version is released. Basically fam-dev.js will replace fam.js right before a new release is published.
- [pages](https://github.com/SethClydesdale/forumactif-messenger/tree/master/pages) can be updated with little impact on the user-end, however, please note that your changes to these pages WILL be visible to Forumactif Messenger users, unless of course the page is new. If adding or making changes to existing pages, please discuss them with the community beforehand.

### Submitting your Changes
Once you feel your changes are ready to submit for review :

1. **Test your changes**

   Testing is an important process of developing software and ensuring that your changes work. Before submitting your code for review, we recommend test running your changes on your forum. You can do this by going to **Admin Panel > Modules > JS Codes Management** and creating a new script with your modified version of fam-dev.js. 
   
   Once the code is installed on your forum, open the browser console (F12 or CTRL+SHIFT+I) and reload the page. If the code executes and there are no errors in your console that means your changes are ready to be submitted !
  
2. **Submit a pull request**
   
   When you're ready to submit your changes for review, Push your local changes to your forked copy of the repository and submit [a pull request](https://help.github.com/articles/about-pull-requests/). In the pull request, choose a title which sums up the changes that you have made, and in the body provide more details about what your changes do. 

Once your pull request is submitted all you need to do is sit back and wait for a reply. We'll discuss the pull request and if any changes are needed, we will help work with you to get your pull request merged. 

---

## Contributing a Theme
Forumactif Messenger offers the ability to change the theme whenever you want, so you can have a more comfortable and personalized experience. Themes are created by the community, which means you can create and submit a theme that the community can use! Read on below to learn more about getting started with creating and submitting your theme.

### Fork and Clone the Repository
You will need to fork the main Forumactif Messenger repository and clone it to your desktop to contribute changes. See the [github help page](https://help.github.com/articles/fork-a-repo) for more information.

### Creating your Theme
There are two types of themes that you can create for Forumactif Messenger and you'll need a basic understanding of [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) to create a theme. The two types of themes that can be created are..

1. **Color Themes** which are simple themes that only modify the main colors of Forumactif Messenger.
2. **Advanced Themes** which are themes that customize more than just the colors of Forumactif Messenger.

#### Getting Started
To begin we'll start simple and create a **Color Theme** so you can get a feel for how creating a theme for Forumactif Messenger works. In your forked copy of the repository open the **themes** folder and copy the contents of [**light.css**](https://github.com/SethClydesdale/forumactif-messenger/blob/master/themes/light.css). This file will be used as a template for creating your theme.

Once the contents are copied to your clipboard, create a new CSS file, **my-theme.css** for example, and paste the contents into this file. After you have done this, we'll be ready to start changing colors. Make sure to read over the notes in the comments of your file for hints and tips.

#### Changing Colors
When working with CSS it's usually best to have a live example, so you can see the results of what you've typed. To do this, go to your forum and open the developer tools. You can open your developer tools with one of the below commands.

- F12
- CTRL+SHIFT+I
- Right Click > Inspect Element

Once your devtools are opened, click the **Elements** tab to view the markup of the document. You can use this tab to see the classes and ids for elements, and the style rules which are currently applied to the selected element. We wont be needing this for the example though. Go ahead and click the little "+" icon in the styles column to create a new style rule, then click "inspector-stylesheet:..." to open the stylesheet.

[![](https://i11.servimg.com/u/f11/18/21/41/30/captur12.png)](https://i11.servimg.com/u/f11/18/21/41/30/captur12.png)

Delete everything in this stylesheet and paste the CSS from your new theme instead. From here on, all you need to do is change the colors in the CSS ; any changes you make will be reflected on page. To get a feel for what changes what, it's best to just play around with the colors and see what they change. If you're already familar with CSS and the devtools you can have a blast and change whatever you like !

[![](https://i11.servimg.com/u/f11/18/21/41/30/captur13.png)](https://i11.servimg.com/u/f11/18/21/41/30/captur13.png)

### Submitting your Theme
Once you're satisfied with your theme you can submit it to Github for the community to use. To submit your theme for review you must push your local changes to your forked copy of the repository and submit [a pull request](https://help.github.com/articles/about-pull-requests/). In the pull request, choose a title which sums up the changes that you have made, and in the body include some basic information about your theme, such as..

- The title of your theme. What would you like your theme to be called?
- The author of the theme. Were you the only one who worked on the theme, did someone else help you?
- An image and/or description of your theme. (optional)

Once your pull request is submitted all you need to do is sit back and wait for a reply. If any changes need to be made, we'll let you know and work with you to help get your pull request merged.

---

## Questions
If you have any questions about contributing to Forumactif Messenger, please open a new issue by [clicking here](https://github.com/SethClydesdale/forumactif-messenger/issues/new). We'll gladly answer any questions that you may have, so don't be afraid to ask !
