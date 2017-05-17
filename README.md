# Forumactif Messenger
Forumactif Messenger (or "FAM" for short) is a JavaScript application or "plugin" that integrates with [Forumotion](https://www.forumotion.com/) forums to enable instant messaging in topics in the style of a SMS app. It allows you to [view topics and post messages in real time](https://i58.servimg.com/u/f58/18/21/41/30/w4f56y10.gif) without ever having to refresh the page. What it does is display your forums, topics, etc.. in a separate window from the forum so you can pick it up and chat with anyone anytime. Even when not using this application, members can still participate in chats by accessing the topics directly on your forum.


## Under Development
Forumactif Messenger is still under development and in the planning phase, so it is not yet ready for production. You can however, install the application on your forum for testing purposes to provide feedback to us. You can also help contribute to the project if you like as well.

Follow the link below to learn how to install Forumactif Messenger on your forum.

https://github.com/SethClydesdale/forumactif-messenger/wiki/Installing


### To do list
Below is a list of features, fixes, and ideas that need reviewing, implementing, or fixing.

#### Implement
- [x] add drop down nav menu for various options such as...
  - [x] a Home button for going back to first history entry
  - [ ] a Settings button for configuring personal settings
  - [x] an About button for viewing info about FAM + Checking for updates on Github
- [x] add message submission in topics
  - [ ] add message editing
  - [ ] add message deletion
  - [ ] add ability to moderate messages (check permissions by query selecting the topic modtools)
  - [x] add auto-refresh for new messages
    - [ ] add timeout for auto-refresh after period of inactivity
  - [ ] add notification when new messages are posted
  - [ ] add indicator for flood control timeout
  - [ ] work on emoticons popup
  - [ ] work on attachment popup for images and videos
- [x] add new topic button
  - [x] setup new topic form and sending functionality
  - [x] load the created topic once it's submitted
- [ ] add page numbers to load older / new pages
- [ ] add button in chats to view older posts
- [x] add icons to topics and forums so it's easier to differentiate the two
  - [ ] change icon colors when a new post is available AND the icon if the forum / topic is locked.
- [ ] add functionality for the ignore config options, so the admin can choose to ignore first posts and announcements / stickies.
- [ ] add new styles for quotes, codeboxes, etc.. in messages (collapsing these elements by default is preferred)
- [x] add theme color to FAM toolbar on Forumactif Edge

#### Fix
- [x] fix actions bar visible when not in a topic
- [x] fix message listener still active while viewing about page
- [ ] fix guests being able to post when there's no reply button
  - [ ] also fix the message sending for guests so guests can leave messages ; it'll require extra data during submission.
- [ ] fix scrolling to the last message when images aren't loaded
- [x] fix avatars and usernames so they link to the user profile
- [x] fix similar topics and other non-message elements displaying as anon message
- [x] fix button and input styles on modernbb
- [ ] clean up timestamps to remove unnecessary data, or just make them look nicer.

#### Misc ideas for later development stages
- [ ] add tab functionality, so the user can have multiple instances of FAM open.
- [ ] add theme picker
- [ ] add bubble color preference
- [ ] add pm support
- [ ] turn into app w/[electron](https://electron.atom.io/)
