# Forumactif SMS
Forumactif SMS (or FASMS for short) is a web application that integrates with your Forumotion forum. It designates a single category or your entire forum as an SMS chat, allowing you to [view topics and post messages in real time](https://i58.servimg.com/u/f58/18/21/41/30/fasms10.gif). What it does is display your forum in a little chat window, in this window forums are converted to groups and topics are converted into chats. Even when not using this application, members can still participate in chats by accessing the topics directly on your forum.


## Under Development
FASMS is still under development and in the planning phase, so it is not yet ready for production. You can however, install the application on your forum for testing purposes to provide feedback to us. You can also help contribute to the project if you like as well.

Follow the steps below to install this application for testing.
1. Go to your forumotion forum.
2. Go to Admin Panel > Modules > JavaScript Codes Management > Create a new script.
3. Set the placement as **In all the pages** and paste [this code](https://github.com/SethClydesdale/forumactif-sms/blob/master/fa-sms.js) as the contents.
4. Save and you can now test FASMS. (it'll be a little chat bubble in the bottom right-hand corner)


### To do list
Below is a list of features, fixes, and ideas that need reviewing, implementing, or fixing.

#### Implement
- [ ] add icons to topics and forums so it's easier to differentiate the two
- [ ] add page numbers to load older / new pages
- [ ] add new topic button
- [ ] add message submission in topics
- [ ] add auto-refresh for new messages
- [ ] add emoticons
- [ ] add attachment popup for images and videos
- [ ] add new styles for quotes, codeboxes, etc.. in messages (collapsing these elements by default is preferred)

#### Fix
- [ ] fix avatars and usernames so they link to the user profile
- [ ] fix similar topics and other non-message elements displaying as anon message
- [ ] fix button and input styles on modernbb
- [ ] remove username and topic title from last post times

#### Misc ideas for later development stages
- [ ] add theme picker
- [ ] add bubble color preference
- [ ] add pm support
- [ ] turn into app w/[electron](https://electron.atom.io/)
