# Forumactif Messenger
Forumactif Messenger (FAM for short) is a web application that integrates with [Forumotion](https://www.forumotion.com/) forums. It enables instant messaging on the forum, allowing you to [view topics and post messages in real time](https://i58.servimg.com/u/f58/18/21/41/30/56hv4610.gif). What it does is display your forum in a little chat window, in this window forums are converted to groups and topics are converted into chats. Even when not using this application, members can still participate in chats by accessing the topics directly on your forum.


## Under Development
FAIM is still under development and in the planning phase, so it is not yet ready for production. You can however, install the application on your forum for testing purposes to provide feedback to us. You can also help contribute to the project if you like as well.

Follow the steps below to install this application for testing.
1. Go to your forumotion forum.
2. Go to Admin Panel > Modules > JavaScript Codes Management > Create a new script.
3. Set the placement as **In all the pages** and paste [this code](https://github.com/SethClydesdale/forumactif-messenger/blob/master/fa-im.js) as the contents.
4. Save and you can now test FAIM. (it'll be a little chat bubble in the bottom right-hand corner)

Checkout [**config**](https://github.com/SethClydesdale/forumactif-messenger/wiki/Config) for info on modifying this plugin.


### To do list
Below is a list of features, fixes, and ideas that need reviewing, implementing, or fixing.

#### Implement
- [x] add drop down nav menu for various options such as...
  - [x] a Home button for going back to first history entry
  - [ ] a Settings button for configuring personal settings
  - [x] an About button for viewing info about FAM + Checking for updates on Github
- [ ] add icons to topics and forums so it's easier to differentiate the two
- [ ] add page numbers to load older / new pages
- [ ] add button in chats to view older posts
- [ ] add new topic button
- [x] add message submission in topics
- [x] add auto-refresh for new messages
- [ ] add notification when new messages are posted
- [ ] add indicator for flood control timeout
- [ ] add emoticons
- [ ] add attachment popup for images and videos
- [ ] add new styles for quotes, codeboxes, etc.. in messages (collapsing these elements by default is preferred)
- [x] add theme color to FAM toolbar on Forumactif Edge

#### Fix
- [ ] fix guests being able to post when there's no reply button
- [ ] fix scrolling to the last message when images aren't loaded
- [x] fix avatars and usernames so they link to the user profile
- [x] fix similar topics and other non-message elements displaying as anon message
- [x] fix button and input styles on modernbb
- [ ] remove username, topic title, and "on"/"by" from last post times

#### Misc ideas for later development stages
- [ ] add theme picker
- [ ] add bubble color preference
- [ ] add pm support
- [ ] turn into app w/[electron](https://electron.atom.io/)
