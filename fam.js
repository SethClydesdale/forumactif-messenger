!window.FAM && (function() {
  window.FAM = {

    // General Configuration of Forumactif Messenger
    // See : https://github.com/SethClydesdale/forumactif-messenger/wiki/Config
    config : {
      chat_page : '',
      main_title : 'Select a Group',
      embed : '',
      tabs : true,

      refresh : 7500,
      timeout : 10*60*1000,
      flood_control : 5000,

      ignore_announcements : false,
      ignore_firstpost : true,

      no_avatar : 'https://illiweb.com/fa/invision/pp-blank-thumb.png',
      no_name : 'Anon',

      lang : {
        loading : 'Loading...',
        idle : 'Forumactif Messenger has fallen asleep due to inactivity. Click here to start chatting again.',

        new_topic : 'New topic',
        start_topic : 'Start topic',

        msg_placeholder : 'Enter message',
        title_placeholder : 'Topic title',

        no_tabs_title : 'Open a new tab',
        no_tabs : 'Uh-oh! You have no tabs opened! Click here to open a new one.',

        tooltip_openFAM : 'Forumactif Messenger',
        tooltip_back : 'Click to go back',
        tooltip_menu : 'Open menu',
        tooltip_home : 'Home',
        tooltip_settings : 'Settings',
        tooltip_about : 'About',
        tooltip_attachments : 'Add attachment',
        tooltip_emoji : 'Add emoticon',
        tooltip_send : 'Send message'
      }
    },


    // toggles Forumactif Messenger
    toggle : function () {
      if (FAM.cache.chat.dataset.hidden == 'true') {
        FAM.cache.chat.dataset.hidden = false;

        if (!FAM.history.restore() && !FAM.history.log['tab' + FAM.tab.active]) {
          FAM.tab.add();
        }

      } else {
        FAM.cache.chat.dataset.hidden = true;
      }
    },


    // encode strings for sending over AJAX
    encode : function (string) {
      return /UTF-8/i.test(document.characterSet) ?
        encodeURIComponent(string) :
        // URI encoding for NON-UTF8 forums
        encodeURIComponent(escape(string).replace(/%u[A-F0-9]{4}/g, function(match) {
          return '&#' + parseInt(match.substr(2), 16) + ';'
        })).replace(/%25/g, '%')
    },


    // get the specified page
    get : function (url, title, noHistory) {
      var type = /\/c\d+/.test(url) ? 'category' :
                 /\/f\d+/.test(url) ? 'forum' :
                 /\/t\d+/.test(url) ? 'topic' : 'category';

      // push new entry to history
      if (!noHistory) {
        FAM.history.update({
          url : url,
          title : title
        });
      }

      // stop listening for message changed
      FAM.message.listener.stop();

      // show / hide back button
      FAM.history.toggleBack();

      // update the main title
      FAM.tab.title(title);

      // display loading texts and change content class
      FAM.cache.content.className = 'FAM-viewing-' + type;
      FAM.cache.content.innerHTML =
      '<div class="FAM-loading">'+
        '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
        '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
      '</div>';
      FAM.cache.actions.innerHTML = '';

      // reset the message log
      if (type == 'topic') {
        FAM.msgLog = {};
      }

      // get the page
      $.get(url, function (data) {
        var a = $(type == 'topic' ? '.post[class*="post--"]' : 'a.forum' + ( FAM.fVersion == 0 ? 'link' : 'title' ) + ', a.topictitle', data),
            form = type == 'topic' ? $('form[action="/post"]', data)[0] : null,
            i = 0,
            j = a.length,
            html = '',
            row, avatar, date, pages, newTopic, type2;

        for (; i < j; i++) {
          // message structure
          if (type == 'topic') {
            html += FAM.msgLog[a[i].className.replace(/.*?(post--\d+).*/, '$1')] = FAM.message.parse(a[i]);

          // forum and category structure
          } else {
            row = $(a[i]).closest(FAM.selector.row);

            if (!row.find('.AD_LastPA')[0]) { // exclude ad forums
              row = row[0];
              avatar = $('.lastpost-avatar img', row)[0];
              date = $(FAM.selector.row_date, row)[0];
              type2 = /c\d+-/.test(a[i].href) ? 'category' :
                      /f\d+-/.test(a[i].href) ? 'forum' :
                      /t\d+-/.test(a[i].href) ? 'topic' : 'unknown';

              html +=
              '<div class="FAM-chat FAM-' + type2 + '" onclick="FAM.get(\'' + a[i].href + ( type2 == 'topic' ? '?view=newest' : '' ) + '\', \'' + a[i].innerText + '\');">'+
                '<span class="FAM-chat-icon fa-stack fa-lg">'+
                  '<i class="fa fa-circle fa-stack-2x"></i>'+
                  '<i class="fa fa-' + ( type2 == 'topic' ? 'comments' : 'folder' ) + ' fa-stack-1x fa-inverse"></i>'+
                '</span>'+

                '<div class="FAM-chat-avatar">'+
                  '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
                '</div>'+

                '<div class="FAM-chat-title">' + a[i].innerText + '</div>'+

                '<div class="FAM-chat-date">' + ( date ? date.innerText : '' ) + '</div>'+
              '</div>';
            }
          }
        }


        // add message actions if the opened url is a topic
        if (type == 'topic') {
          FAM.cache.content.innerHTML = html;
          FAM.cache.actions.innerHTML =
          '<button id="FAM-attachment" type="button" title="' + FAM.config.lang.tooltip_attachments + '"><i class="fa fa-paperclip"></i></button>'+
          '<button id="FAM-emoji" type="button" onclick="FAM.message.emoji(this);" title="' + FAM.config.lang.tooltip_emoji + '"><i class="fa fa-smile-o"></i></button>'+
          '<textarea id="FAM-msg" placeholder="' + FAM.config.lang.msg_placeholder + '" onkeyup="FAM.message.validate(this.value, event);"></textarea>'+
          '<button id="FAM-send" type="button" onclick="FAM.message.send();" data-disabled="true" title="' + FAM.config.lang.tooltip_send + '"><i class="fa fa-paper-plane"></i></button>'+
          ( form ? form.outerHTML.replace(/id=".*?"|name=".*?"/, '').replace('<form', '<form name="fampost" style="display:none"') : '' );

          FAM.message.scroll();

          // listen for new posts and changes to existing messages
          FAM.message.listener.start();

        // standard forum / category view
        } else {
          FAM.cache.content.innerHTML = html;
          FAM.cache.actions.innerHTML = '';

          // add new topic icon if available
          if (type == 'forum') {
            newTopic = $(FAM.selector.new_topic, data)[0];

            if (newTopic) {
              FAM.cache.actions.innerHTML =
              '<span id="FAM-new-topic" class="fa-stack fa-2x" onclick="FAM.topic.create(\'' + ( FAM.fVersion == 5 ? newTopic : newTopic.parentNode ).href + '\');" title="' + FAM.config.lang.new_topic + '">'+
                '<i class="fa fa-circle fa-stack-2x"></i>'+
                '<i class="fa fa-plus fa-stack-1x fa-inverse"></i>'+
              '</span>';
            }
          }

        }
      });
    },


    // message methods and data
    message : {
      // insert text into the message input
      insert : function (string, pad) {
        var msg = FAM.cache.actions.querySelector('#FAM-msg'),
            addedText = (pad ? ' ' : '') + string + (pad ? ' ' : ''),
            position = 0;

        if (msg) {

          try {
            position = msg.selectionEnd;
            msg.value = msg.value.slice(0, position) + addedText + msg.value.slice(position, msg.length);
            msg.selectionEnd = position + addedText.length;
          } catch (e) {
            msg.value += addedText;
          }

          msg.focus();
          FAM.message.validate(msg.value);
        }
      },


      // validate a message to make sure that sending it is okay
      validate : function (message, e) {
        var send = FAM.cache.actions.querySelector('#FAM-send');

        if (message && send.dataset.disabled == 'true') {
          send.dataset.disabled = false;

        } else if (!message && send.dataset.disabled == 'false') {
          send.dataset.disabled = true;
        }

        if (e && FAM.cache.actions.querySelector('#FAM-send').dataset.disabled != 'true' && e.ctrlKey && {
          'Enter' : 1,
          '13' : 1
        }[e.key || e.keyCode]) {
          FAM.message.send();
        }
      },


      // send a message to the topic
      send : function () {
        if (FAM.message.sending) {
          return false;
        } else {
          FAM.message.sending = true;
        }

        var msg = document.getElementById('FAM-msg'),
            val = msg.value;

        msg.value = '';
        FAM.message.validate();

        // show placeholder message until the sent message is ready
        FAM.cache.content.insertAdjacentHTML('beforeend',
          '<div class="FAM-msg FAM-my-msg FAM-msg-placeholder">'+
            '<div class="FAM-msg-avatar">' + _userdata.avatar + '</div>'+
            '<div class="FAM-msg-box">'+
              '<div class="FAM-msg-content">'+
                '<div class="FAM-msg-text"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></div>'+
              '</div>'+
              '<div class="FAM-msg-date"></div>'+
            '</div>'+
          '</div>'
        );
        FAM.message.scroll();

        // post the message to the topic
        $.post('/post', $(document.fampost).serialize().replace(
          'message=',
          'message=' + FAM.encode(val)
        ) + '&post=1', function (data) {
          // get the new message and remove the placeholder + sending restriction
          FAM.message.check(function () {
            FAM.cache.content.removeChild(FAM.cache.content.querySelector('.FAM-msg-placeholder'));
            FAM.message.scroll();

            // wait the specified time before sending another message
            window.setTimeout(function () {
              FAM.message.sending = false;
            }, FAM.config.flood_control);
          });
        });
      },


      // returns the parsed message
      parse : function (post) {
        var avatar, name, pLink, group, date, msg;

        avatar = $(FAM.selector.post_avatar, post)[0];

        // get username
        name = $(FAM.selector.post_name, post)[0];

        // check if the user link is available
        pLink = name ? name.getElementsByTagName('A')[0] : null;
        pLink = pLink ? '<a href="' + pLink.href + '">' : null;

        // check if the user is in a group
        group = name ? name.getElementsByTagName('SPAN')[0] : null;
        group = group ? '<span style="' + group.getAttribute('style') + '"><strong>' : null;

        // check if the username is available
        name = name ? name.innerText : FAM.config.no_name;

        date = $(FAM.selector.post_date, post)[0];
        msg = $(FAM.selector.post_message, post)[0];

        return '<div class="FAM-msg' + ( name == _userdata.username ? ' FAM-my-msg' : '' ) + ' ' + post.className.replace(/.*?(post--\d+).*/, '$1') + '">'+
          '<div class="FAM-msg-avatar">'+
            (pLink ? pLink : '')+
            '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
            (pLink ? '</a>' : '')+
          '</div>'+

          '<div class="FAM-msg-box">'+
            '<div class="FAM-msg-name">'+
              (pLink ? pLink : '')+
                (group ? group : '')+
                  name+
                (group ? '</strong></span>' : '')+
              (pLink ? '</a>' : '')+
            '</div>'+
            '<div class="FAM-msg-content">'+
              '<div class="FAM-msg-text">' + ( msg ? msg.innerHTML.replace(/<br>/g, '\n').replace(/^\n+|\n+$|^\s+|\s+$/g, '').replace(/\n/g, '<br>') : '' ) + '</div>'+
            '</div>'+
            '<div class="FAM-msg-date">' + ( date ? date.innerText : '' ) + '</div>'+
          '</div>'+
        '</div>';
      },


      // check for new messages / edits and update the message list
      check : function (callback) {
        $.get(FAM.history.log['tab' + FAM.tab.active][FAM.history.log['tab' + FAM.tab.active].length - 1].url, function (data) {
          for (var a = $('.post[class*="post--"]', data), i = 0, j = a.length, pid, msg; i < j; i++) {
            pid = a[i].className.replace(/.*?(post--\d+).*/, '$1');
            msg = FAM.message.parse(a[i]);

            // check for edited messages and update them
            if (FAM.msgLog[pid]) {
              if (FAM.msgLog[pid] != msg) {
                FAM.msgLog[pid] = msg;
                FAM.cache.content.querySelector('.FAM-msg.' + pid).outerHTML = msg;
              }

            // add in new messages if there are any
            } else {
              FAM.msgLog[pid] = msg;
              FAM.cache.content.insertAdjacentHTML('beforeend', msg);
              FAM.message.scroll();
            }
          }

          // optional callback to execute, mainly used for send()
          if (typeof callback === 'function') {
            callback();
          }
        });
      },


      // methods that listen for message changes
      listener : {
        // start listening for changes
        start : function () {
          FAM.message.listener.listening = setInterval(function () {
            if (!FAM.message.sending) {
              FAM.message.check();
            }
          }, FAM.config.refresh < 3000 ? 3000 : FAM.config.refresh);

          FAM.message.listener.idle();
          $(document).on('mousemove keypress click', FAM.message.listener.idle);
        },


        // kill the message listener if it's active
        stop : function () {
          if (FAM.message.listener.listening) {
            FAM.message.sending = false;
            clearInterval(FAM.message.listener.listening);
            delete FAM.message.listener.listening;
          }

          if (FAM.message.listener.idling) {
            clearTimeout(FAM.message.listener.idling);
            delete FAM.message.listener.idling;

            $(document).off('mousemove keypress click', FAM.message.listener.idle);
          }
        },


        // kill listener after a specified period of inactivity
        idle : function () {
          if (FAM.message.listener.idling) {
            clearTimeout(FAM.message.listener.idling);
          }

          FAM.message.listener.idling = setTimeout(function () {
            FAM.message.listener.stop();
            FAM.cache.chat.insertAdjacentHTML('beforeend',
              '<div id="FAM-idle" class="FAM-loading" onclick="FAM.message.listener.start(); FAM.cache.chat.removeChild(this);">'+
                '<p><i class="fa fa-moon-o fa-3x"></i>' + FAM.config.lang.idle + '</p>'+
              '</div>'
            );
          }, FAM.config.timeout > 15*60*1000 ? 15*60*1000 : FAM.config.timeout);
        }
      },


      // scroll to the newest message or specified amount
      scroll : function (amount) {
        FAM.cache.content.scrollTop = amount || FAM.cache.content.scrollHeight;
      },


      // call the emoji list to the specified element (caller)
      emoji : function (caller) {
        var active = document.getElementById('FAM-emoji-list'),
            selector;

        if (active) {
          active.style.display = active.style.display == 'none' ? 'block' : 'none';

        } else {
          selector = document.createElement('IFRAME');
          selector.src = '/post?mode=smilies';
          selector.id = 'FAM-emoji-list';
          selector.className = 'FAM-dropdown';

          selector.onload = function () {
            try {
              var doc = this.contentDocument || this.contentWindow.document,
                  emoji = $('a[href*="insert_chatboxsmilie"]', doc),
                  i = 0,
                  j = emoji.length;

              for (; i < j; i++) {
                emoji[i].dataset.emoji = emoji[i].href.replace(/.*?'(.*?)'.*/, '$1');
                emoji[i].href = '#';
                emoji[i].onclick = function () {
                  FAM.message.insert(this.dataset.emoji, true);
                  return false;
                };
              }

              $('a[href="javascript:window.close();"]', doc).hide();

            } catch (e) {
              console.log(e);
            }
          };

          caller.parentNode.insertBefore(selector, caller);
        }

      }
    },


    // topic methods
    topic : {
      // open the topic creation page
      create : function (url, noHistory) {
        if (!noHistory) {
          FAM.history.update({
            url : url,
            title : 'New topic',
            recall : {
              path : 'topic.create',
              args : [url, true]
            }
          });
        }

        FAM.history.toggleBack();
        FAM.tab.title(FAM.config.lang.new_topic);

        FAM.cache.content.className = 'FAM-viewing-newtopic';
        FAM.cache.content.innerHTML =
        '<div class="FAM-loading">'+
          '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
          '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
        '</div>';
        FAM.cache.actions.innerHTML = '';

        $.get(url, function (data) {
          var form = $('form[action="/post"]', data)[0];

          FAM.cache.content.innerHTML =
          '<div id="FAM-newtopic-box" class="FAM-content-block">'+
            '<form name="fampost">'+
              '<div class="FAM-row"><input id="FAM-topic-subject" class="FAM-inputbox" type="text" placeholder="' + FAM.config.lang.title_placeholder + '" name="subject"></div>'+
              '<div class="FAM-row"><textarea id="FAM-topic-message" class="FAM-inputbox" name="message" placeholder="' + FAM.config.lang.msg_placeholder + '"></textarea></div>'+
              '<div class="FAM-row FAM-center"><button class="FAM-button" type="button" onclick="FAM.topic.publish()"><i class="fa fa-share"></i> ' + FAM.config.lang.start_topic + '</button></div>'+
              '<div style="display:none">' + $('input[name="auth[]"]', form)[0].parentNode.innerHTML + '</div>'+
            '</form>'+
          '</div>';
        });
      },


      // posts the topic to the forum
      publish : function () {
        var subject = document.fampost.subject.value,
            formData = $(document.fampost).serialize().replace(/(subject|message)=.*?&/g, function (match, key) {
              return key + '=' + FAM.encode({
                subject : subject,
                message : document.fampost.message.value
              }[key]) + '&';
            }) + '&post=1';

        FAM.cache.content.innerHTML =
        '<div class="FAM-loading">'+
          '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
          '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
        '</div>';

        $.post('/post', formData, function (data) {
          FAM.get('/t' + $('a[href^="/viewtopic?t="]', data)[0].href.replace(/.*?t=(\d+)&.*/, '$1') + '-' + encodeURIComponent(subject.toLowerCase().replace(/\s/g, '-')) + '?view=newest', subject);
        });
      }
    },


    // github pages
    page : {
      // information about Forumactif Messenger
      about : {
        open : function (noHistory) {
          if (!noHistory) {
            FAM.history.update({
              url : '',
              title : 'About',
              recall : {
                path : 'page.about.open',
                args : [true]
              }
            });
          }

          FAM.history.toggleBack();
          FAM.message.listener.stop();
          FAM.tab.title('About');

          FAM.cache.content.className = 'FAM-viewing-github';
          FAM.cache.content.innerHTML =
          '<div class="FAM-loading">'+
            '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
            '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
          '</div>';

          $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/about.md', function (data) {
            FAM.cache.content.innerHTML = data.replace(/<a/g, '<a target="_blank"')
                                              .replace('{CLIENT_VERSION}', '<a href="https://github.com/SethClydesdale/forumactif-messenger/releases/tag/' + FAM.version + '" target="_blank">' + FAM.version + '</a>');

            var status = FAM.cache.content.querySelector('#FAM-version-status'),
                code = FAM.cache.content.querySelector('#FAM-update-code');

            if (FAM.version != FAM.cache.content.querySelector('#FAM-version-github').innerText) {
              status.innerHTML = '<i class="fa fa-exclamation-circle"></i> A new version of Forumactif Messenger is available!';
              code.value = 'Click the UPDATE button to get the latest release from Github';
              FAM.cache.content.querySelector('#FAM-update').innerHTML = '<i class="fa fa-arrow-circle-up"></i> Update';

            } else {
              status.innerHTML = '<i class="fa fa-check-circle"></i> Forumactif Messenger is up to date!';
              code.value = 'Click the SYNC button to sync Forumactif Messenger with the latest release from Github.'
            }
          });
        },


        // get the latest version of Forumactif Messenger from Github
        update : function () {
          FAM.cache.content.querySelector('#FAM-update').outerHTML = '<p id="FAM-update" style="text-align:center;"><i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i></p>';

          $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/fam.js', function (data) {
            var config = data.replace(/[\s\S]*?(config.*?:.*?\{[\s\S]*?\},)[\s\S]*/, '$1').replace(/config.*?:/, 'window.fam_new_config = ').replace(/,$/, ';'),
                lang = data.replace(/[\s\S]*?(lang.*?:.*?\{[\s\S]*?\})[\s\S]*/, '$1').replace(/lang.*?:/, 'window.fam_new_lang = '),
                script = document.createElement('SCRIPT'),
                k;

            script.type = 'text/javascript';
            script.text = config + '\n' + lang;
            document.body.appendChild(script);

            for (k in fam_new_lang) {
              if (typeof FAM.config.lang[k] === 'undefined') {
                FAM.config.lang[k] = fam_new_lang[k];
              }
            }

            for (k in fam_new_config) {
              if (typeof FAM.config[k] === 'undefined') {
                FAM.config[k] = fam_new_config[k];
              }
            }

            FAM.cache.content.querySelector('#FAM-update').outerHTML = '<p>Replace your current Forumactif Messenger script with the one below. It should be applied in <strong>Admin Panel > Modules > JavaScript codes management</strong>.</p>';
            FAM.cache.content.querySelector('#FAM-update-code').value = data.replace(/config.*?:.*?\{[\s\S]*?\},/, 'config : ' + JSON.stringify(FAM.config, null, 2) + ',');
          });
        }
      },

      settings : {
        // get and open the settings page
        open : function () {

        },
      }
    },


    // log history so the user can go back
    history : {
      log : {},


      // save history to localStorage
      save : function () {
        if (window.JSON && window.localStorage) {
          localStorage.fam_data = JSON.stringify({
            active : FAM.tab.active,
            total : FAM.tab.total,
            history : FAM.history.log
          });
        }
      },


      // restore history
      restore : function () {
        if (window.JSON && window.localStorage && localStorage.fam_data) {

          if (!FAM.history.restored) {
            var data = JSON.parse(localStorage.fam_data), i;

            FAM.tab.total = data.total;
            FAM.history.log = data.history;

            for (i in FAM.history.log) {
              FAM.tab.add(i.replace('tab', ''), FAM.history.log[i][FAM.history.log[i].length - 1].title);
            }

            if (data.active) {
              FAM.tab.focus(data.active);
            } else {
              FAM.tab.add();
            }

            FAM.history.restored = true;
          }

          return true;
        } else {
          return false;
        }
      },


      // update history with new entry
      update : function (history) {
        FAM.history.log['tab' + FAM.tab.active].push(history);

        // save user tabs
        FAM.history.save();
      },


      // goes back in history to the beginning or by 1
      back : function (begin) {
        var history = FAM.history.log['tab' + FAM.tab.active][begin ? 0 : FAM.history.log['tab' + FAM.tab.active].length - 2];

        begin ? FAM.history.log['tab' + FAM.tab.active] = FAM.history.log['tab' + FAM.tab.active].slice(0, 1) : FAM.history.log['tab' + FAM.tab.active].pop();

        if (history.recall) {
          FAM.history.recall(history.recall);

        } else {
          FAM.get(history.url, history.title, true);
        }

        // stop listening for message changes
        FAM.message.listener.stop();

        // save user tabs
        FAM.history.save();
      },


      // recall a page opened by a function
      recall : function (data) {
        var path = data.path.split('.'),
            open = FAM,
            i = 0,
            j = path.length;

        for (; i < j; i++) {
          open = open[path[i]];
        }

        open.apply(null, data.args);
      },


      // toggles the back button
      toggleBack : function () {
        if (FAM.history.log['tab' + FAM.tab.active].length > 1 && FAM.cache.back.style.display == 'none') {
          FAM.cache.back.style.display = '';

        } else if (FAM.history.log['tab' + FAM.tab.active].length <= 1 && FAM.cache.back.style.display != 'none') {
          FAM.cache.back.style.display = 'none';
        }
      }
    },


    // tab functionality
    tab : {
      active : 0, // currently active tab
      total : 0, // total tabs created (used for assigning unique ids)


      // add a new tab
      add : function (restore, title) {
        var id = restore || ++FAM.tab.total;

        FAM.cache.tabs.insertAdjacentHTML('beforeend',
          '<div id="FAM-tab-' + id + '" class="FAM-tab">'+
            '<span class="FAM-tab-name" onclick="FAM.tab.focus(' + id + ')">' + ( title ? title : FAM.config.lang.loading ) + '</span>'+
            '<i class="FAM-tab-close fa fa-times" onclick="FAM.tab.close(' + id + ')"></i>'+
          '</div>'
        );


        if (!restore) {
          FAM.history.log['tab' + id] = [];
          FAM.tab.focus(id);
        }
      },


      // close the specified tab
      close : function (id) {
        var dead = FAM.cache.tabs.querySelector('#FAM-tab-' + id),
            survivor = dead.previousSibling ? dead.previousSibling :
                       dead.nextSibling ? dead.nextSibling :
                       null;

        if (survivor && id == FAM.tab.active) {
          FAM.tab.focus(survivor.id.replace('FAM-tab-', ''));

        } else if (!survivor) {
          FAM.message.listener.stop();

          FAM.tab.title(FAM.config.lang.no_tabs_title);
          FAM.cache.content.innerHTML =
          '<div id="FAM-no-tabs" class="FAM-loading" onclick="FAM.tab.add()">'+
            '<p><i class="fa fa-plus fa-3x"></i>' + FAM.config.lang.no_tabs + '</p>'+
          '</div>';
          FAM.cache.actions.innerHTML = '';

          FAM.tab.active = 0;
        }

        dead.parentNode.removeChild(dead);
        delete FAM.history.log['tab' + id];
        FAM.history.save();
      },


      // focus the specified tab
      focus : function (id) {
        if (id == FAM.tab.active) {
          return false;
        }

        var active = FAM.cache.tabs.querySelector('#FAM-tab-' + FAM.tab.active),
            tab = FAM.cache.tabs.querySelector('#FAM-tab-' + id),
            history = FAM.history.log['tab' + id];

        if (active) {
          active.className = 'FAM-tab';
        }

        tab.className = 'FAM-tab FAM-tab-active';
        FAM.cache.tabs.scrollLeft = tab.offsetLeft - tab.getBoundingClientRect().width;
        FAM.tab.active = id;

        if (history.length) {
          history = history[history.length - 1];
          history.recall ? FAM.history.recall(history.recall) : FAM.get(history.url, history.title, true);
          FAM.history.save();

        } else {
          FAM.get(FAM.config.chat_page || '/forum', FAM.config.main_title);
        }
      },


      // changes the main title and focused tab title
      title : function (string) {
        FAM.cache.toolbar.querySelector('.FAM-maintitle').innerText = string;
        FAM.cache.tabs.querySelector('#FAM-tab-' + FAM.tab.active + ' .FAM-tab-name').innerText = string;
      },
    },


    // initial setup of FAM
    init : function () {
      var initialized = false;

      // builds the necessary chat elements
      function build () {
        var button = document.createElement('A'),
            chat = document.createElement('DIV'),
            frag = document.createDocumentFragment();

        chat.id = 'FAM';
        chat.className = FAM.config.embed ? 'FAM-embeded' : '';
        chat.dataset.hidden = FAM.config.embed ? false : true;
        chat.innerHTML =
        '<div id="FAM-toolbar">'+
          '<div id="FAM-toolbar-inner">'+
            '<span id="FAM-back" class="FAM-toolbar-button" onclick="FAM.history.back()" style="display:none" title="' + FAM.config.lang.tooltip_back + '"><i class="fa fa-arrow-left"></i></span>'+
            '<h1 class="FAM-maintitle"></h1>'+
            '<span id="FAM-menu-toggle" class="FAM-toolbar-button" title="' + FAM.config.lang.tooltip_menu + '"><i class="fa fa-ellipsis-h"></i></span>'+
            '<div id="FAM-menu" style="display:none;">'+
              '<div class="FAM-menu-option" onclick="FAM.history.back(true)" title="' + FAM.config.lang.tooltip_home + '"><i class="fa fa-home"></i></div>'+
              '<div class="FAM-menu-option" onclick="FAM.page.settings.open()" title="' + FAM.config.lang.tooltip_settings + '"><i class="fa fa-cog"></i></div>'+
              '<div class="FAM-menu-option" onclick="FAM.page.about.open()" title="' + FAM.config.lang.tooltip_about + '"><i class="fa fa-question-circle"></i></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="FAM-tab-container" ' + ( FAM.config.tabs ? '' : 'style="display:none"' ) + '>'+
          '<div id="FAM-tabs"></div>'+
          '<div id="FAM-tab-add" onclick="FAM.tab.add()"><i class="fa fa-plus"></i></div>'+
        '</div>'+
        '<div id="FAM-content"></div>'+
        '<div id="FAM-actions"></div>';
        frag.appendChild(chat);

        if (!FAM.config.embed) {
          button.id = 'FAM-button';
          button.title = FAM.config.lang.tooltip_openFAM;
          button.innerHTML = '<i class="fa fa-comment"></i>';
          button.onclick = FAM.toggle;
          frag.appendChild(button);
        }

        // cache nodes
        FAM.cache = {
          button : button,
          chat : chat,
          back : chat.querySelector('#FAM-back'),
          toolbar : chat.querySelector('#FAM-toolbar'),
          tabs : chat.querySelector('#FAM-tabs'),
          content : chat.querySelector('#FAM-content'),
          actions : chat.querySelector('#FAM-actions')
        };

        // toggle FAM menu on click
        chat.querySelector('#FAM-menu-toggle').onclick = function () {
          var menu = FAM.cache.toolbar.querySelector('#FAM-menu');
          menu.style.display = menu.style.display == 'none' ? 'block' : 'none';
          return false;
        };


        // set forum version
        FAM.fVersion = document.querySelector('.bodylinewidth') ? 0 :
                      document.getElementById('phpbb') ? 1 :
                      document.querySelector('div.pun') ? 2 :
                      document.getElementById('ipbwrapper') ? 3 :
                      document.getElementById('fa_edge') ? 4 :
                      document.getElementById('modernbb') ? 5 :
                      'badapple';

        // specific style changes for Forumactif Edge
        if (FAM.fVersion == 4) {
          FAM.cache.toolbar.querySelector('#FAM-toolbar-inner').className = 'color-primary';
        }

        // css selectors by version
        FAM.selector = {
          row : [
            'tr', // phpbb2
            '.row', // phpbb3
            'tr', // punbb
            'tr', // invision
            '.forum-block', // forumactif edge
            '.row' // modernbb
          ][FAM.fVersion],

          row_date : [
            '.row3Right .postdetails, .row3.over .gensmall', // phpbb2
            '.lastpost span:not(.lastpost-avatar)', // phpbb3
            '.tcr', // punbb
            '.lastaction, td:last-child > span:last-child', // invision
            '.forum-lastpost', // forumactif edge
            '.lastpost > span:not(.lastpost-avatar)' // modernbb
          ][FAM.fVersion],

          new_topic : [
            '#i_post', // phpbb2
            '.i_post', // phpbb3
            '.i_post', // punbb
            '.i_post', // invision
            '.i_post', // forumactif edge
            'a.ion-edit[href$="mode=newtopic"]' // modernbb
          ][FAM.fVersion],

          post_reply : [
            '', // phpbb2
            '', // phpbb3
            '', // punbb
            '', // forumactif edge
            '' // modernbb
          ][FAM.fVersion],

          post_avatar : [
            '.postdetails.poster-profile img', // phpbb2
            '.postprofile dt img', // phpbb3
            '.user-basic-info img', // punbb
            '.postprofile dt img', // invision
            '.user-avatar img', // forumactif edge
            '.postprofile-avatar img' // modernbb
          ][FAM.fVersion],

          post_name : [
            '.name', // phpbb2
            '.postprofile dt strong', // phpbb3
            '.username', // punbb
            '.postprofile dt strong', // invision
            '.username', // forumactif edge
            '.postprofile-name' // modernbb
          ][FAM.fVersion],

          post_date : [
            '.postdetails:not(.poster-profile)', // phpbb2
            '.author', // phpbb3
            '.posthead h2', // punbb
            '.author', // invision
            '.author', // forumactif edge
            '.topic-date' // modernbb
          ][FAM.fVersion],

          post_message : [
            '.postbody > div', // phpbb2
            '.content > div', // phpbb3
            '.entry-content > div:not(.vote) > div', // punbb
            '.post-entry > div:not(.clear, .vote)', // invision
            '.content > div', // forumactif edge
            '.content > div' // modernbb
          ][FAM.fVersion]
        };

        (FAM.config.embed ? document.querySelector(FAM.config.embed) : document.body).appendChild(frag);

        if (FAM.config.embed) {
          !FAM.history.restore() && FAM.tab.add();
        }

        delete FAM.init;
      };


      try {
        // wait for the doc to be interactive / complete
        function ready () {
          if (!initialized && /interactive|complete/.test(document.readyState)) {
            build();
            initialized = true;
          }
        };

        ready();

        if (!initialized) {
          document.addEventListener('readystatechange', ready);
        }

      } catch (error) {
        $(build); // jQuery fallback
      }

    },

    version : 'v0.4.0'
  };


  // add view=newest query to topic urls if it's not there
  if (/\/t\d+/.test(FAM.config.chat_page) && !/view=newest/.test(FAM.config.chat_page)) {
    FAM.config.chat_page = FAM.config.chat_page.replace(/#\d+$/, '') + '?view=newest';
  }


  // close drop downs that are left open
  $(document).on('mousedown', function (e) {
    // drop down should be the first element in the arrays, other elements are those that should be excluded
    var close = [
      [FAM.cache.chat.querySelector('#FAM-menu'), FAM.cache.chat.querySelector('#FAM-menu-toggle')],
      [FAM.cache.chat.querySelector('#FAM-emoji-list'), FAM.cache.chat.querySelector('#FAM-emoji')]
    ], i = 0, j = close.length, a;

    for (; i < j; i++) {
      if (close[i][0] && close[i][0].style.display != 'none') {
        a = $(close[i]);

        if (!a.is(e.target) && !a.has(e.target)[0]) {
          close[i][0].style.display = 'none';
        }
      }
    }
  });

  // setup FAM
  FAM.init();


  // FAM styles
  $('head').append('<style>@import url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css);#modernbb #FAM i.fa,#modernbb #FAM-button i.fa,#modernbb #FAM-send{margin:initial;vertical-align:initial}#FAM a{color:#06d;text-decoration:none}#FAM a:hover{color:#04a;text-decoration:underline}#FAM a:active{color:#028}#FAM,#FAM *{box-sizing:border-box}#FAM{color:#333;font-size:13px;font-family:Arial,sans-serif;background:#fff;border:1px solid #ddd;position:fixed;height:70%;width:40%;min-height:400px;min-width:300px;right:3px;z-index:99999;visibility:visible;opacity:1;bottom:35px;transition:500ms}#FAM[data-hidden=true]{visibility:hidden;opacity:0;bottom:-100%}#FAM.FAM-embeded{position:relative;bottom:0;right:0;width:100%;height:400px;margin:12px 0;z-index:1}#FAM-button,#FAM-toolbar{color:#fff;background:#39f}#FAM-button{font-size:18px;text-align:center;position:fixed;width:30px;right:3px;bottom:3px;cursor:pointer;z-index:99999;height:30px}#FAM-button i,#FAM-tab-add i{line-height:30px}#FAM-button:hover{background-color:#28e}#FAM-button:active{background-color:#17d}#FAM-toolbar{border-bottom:1px solid #28e;height:40px;margin:-1px -1px 0}.FAM-maintitle{color:#fff;font-size:18px;text-align:center;width:70%;margin:0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-toolbar-button{color:#fff;font-size:24px;position:absolute;top:-1px;height:40px;cursor:pointer}#FAM-toolbar,.FAM-toolbar-button i{line-height:40px}.FAM-toolbar-button i:hover{color:#eee}.FAM-toolbar-button i:active{color:#ddd}#FAM-back{left:10px}#FAM-menu-toggle{right:10px}#FAM-menu{color:#666;background:#fff;border:1px solid #ccc;position:absolute;right:-1px;top:39px;min-width:75px;z-index:2}.FAM-menu-option{font-size:30px;text-align:center;padding:4px;cursor:pointer}.FAM-menu-option:hover{color:#333}.FAM-menu-option:active{color:#000}#FAM-back[style*=none]~#FAM-menu .FAM-menu-option:first-child{display:none}#FAM-content{height:90%;height:calc(100% - 70px);overflow-y:auto;overflow-x:hidden}#FAM-content.FAM-viewing-topic{height:calc(100% - 110px)}#FAM-tab-container[style*=none]+#FAM-content{height:calc(100% - 40px)}#FAM-tab-container[style*=none]+#FAM-content.FAM-viewing-topic{height:calc(100% - 80px)}.FAM-content-block{font-size:14px;padding:12px}.FAM-loading{font-size:18px;font-weight:700;display:flex;justify-content:center;align-items:center;text-align:center;position:absolute;top:0;left:0;right:0;bottom:0}.FAM-loading i{display:block;margin-bottom:12px}#FAM-no-tabs{cursor:pointer}#FAM-idle,.FAM-button{color:#fff;cursor:pointer}#FAM-idle{background:rgba(0,0,0,.7);transition:300ms}#FAM-idle:hover{background:rgba(0,0,0,.6)}.FAM-button{font-size:16px;font-weight:700;text-transform:uppercase;background:#39f;border:none;border-radius:4px;display:block;height:40px;padding:0 12px;margin:3px auto;outline:none}.FAM-button:hover{background:#28e}.FAM-button:active{background:#17d}#FAM .FAM-inputbox{color:#333;font-size:14px;font-family:Arial,sans-serif;background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px;width:100%;cursor:text;outline:none}#FAM textarea.FAM-inputbox{height:150px;resize:none}#FAM .FAM-inputbox:hover{border-color:#ccc}#FAM .FAM-inputbox:focus{border-color:#39f}.FAM-center{text-align:center}.FAM-row{margin:12px 0}#FAM ::-webkit-scrollbar{width:8px;height:8px}#FAM ::-webkit-scrollbar-track{background-color:#ddd}#FAM ::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,.1);border:none}#FAM ::-webkit-scrollbar-button:single-button{height:0;width:0}#FAM ::-webkit-scrollbar-thumb:hover{background-color:rgba(0,0,0,.2)}#FAM ::-webkit-scrollbar-thumb:active{background-color:rgba(0,0,0,.3)}#FAM-actions{height:40px;border-top:1px solid #ddd;display:none}.FAM-viewing-forum+#FAM-actions,.FAM-viewing-topic+#FAM-actions{display:block}.FAM-viewing-forum+#FAM-actions{height:0}#FAM-new-topic{position:absolute;right:8px;bottom:3px;cursor:pointer}#FAM-new-topic .fa-plus{line-height:57px}#FAM-new-topic .fa-circle{color:#39f}#FAM-new-topic:hover .fa-circle{color:#28e}#FAM-new-topic:active .fa-circle{color:#17d}#FAM-actions button{color:#333;font-size:18px;background:#fff;border:none;border-left:1px solid #ddd;height:40px;width:40px;cursor:pointer;outline:none}#FAM-actions button:first-child{border:none}#FAM-actions button:hover{background:#eee}#FAM-actions button:active{background:#ddd}#FAM-actions button[data-disabled=true]{pointer-events:none}#FAM-actions button[data-disabled=true]>*{opacity:.5}#FAM-actions .FAM-dropdown{background:#fff;border:1px solid #ddd;position:absolute;left:0;bottom:40px;width:250px;height:300px;z-index:2}#FAM-msg{color:#333;font-size:14px;font-family:Arial,sans-serif;background:#fff;border:none;border-left:1px solid #ddd!important;height:40px;width:calc(100% - 120px);margin:0;padding:6px;vertical-align:top;outline:none;resize:none}.FAM-chat{color:#333;border-bottom:2px solid #ddd;position:relative;padding:12px;height:80px;cursor:pointer}.FAM-chat:hover{background-color:#eee}.FAM-chat-icon{position:absolute;left:1px;bottom:0;z-index:1}.FAM-chat-icon .fa-circle{color:#999}.FAM-chat-avatar{position:absolute;left:10px;top:50%;margin-top:-20px;height:40px;width:40px;overflow:hidden}.FAM-chat-avatar img,.FAM-msg-avatar img{height:100%;width:100%}.FAM-chat-date,.FAM-chat-title{position:absolute;left:0;width:100%;padding:0 12px 0 60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-chat-title{font-size:14px;font-weight:700;top:20px}.FAM-chat-date{bottom:20px}.FAM-msg{position:relative;padding:12px}.FAM-msg:after{content:"";display:table;clear:both}.FAM-msg-avatar{height:40px;width:40px;margin-top:16px;overflow:hidden;float:left}.FAM-my-msg .FAM-msg-avatar{margin-top:0;float:right}.FAM-msg-box{float:right;width:80%;width:calc(100% - 40px);padding-left:15px}.FAM-my-msg .FAM-msg-box{float:left;padding:0 15px 0 0}.FAM-msg-content{color:#000;background:#ddd;border-radius:4px;padding:8px 12px;margin:3px 0;min-height:36px;max-width:80%;position:relative;float:left}.FAM-msg-content:before{content:"";height:0;width:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:10px solid #ddd;position:absolute;top:13px;left:-10px}.FAM-my-msg .FAM-msg-content{color:#fff;background:#07c;float:right}.FAM-my-msg .FAM-msg-content:before{border-right:none;border-left:10px solid #07c;top:12px;left:auto;right:-10px}.FAM-msg-text{font-size:14px;line-height:20px;white-space:pre-wrap;word-wrap:break-word}.FAM-msg-text .fa-circle-o-notch{font-size:20px}#FAM .FAM-msg-text a{color:inherit;text-decoration:underline}#FAM .FAM-msg-text a:hover{text-decoration:none}.FAM-msg-text *{max-width:100%}.FAM-msg-text img{max-height:200px}.FAM-msg-date{clear:both}.FAM-msg-date,.FAM-msg-name{font-size:12px;padding:0 3px;width:100%}.FAM-my-msg .FAM-msg-name{display:none}.FAM-my-msg .FAM-msg-date{text-align:right}#FAM-tab-container{height:30px;position:relative;border-bottom:1px solid #ddd}#FAM-tab-add{font-size:18px;text-align:center;border-left:1px solid #ddd;position:absolute;right:0;top:0;width:30px;height:30px;cursor:pointer}#FAM-tab-add:hover,#FAM-version-status i.fa-check-circle{color:#39f}#FAM-tabs{width:80%;width:calc(100% - 30px);white-space:nowrap;overflow:hidden}#FAM-tabs:hover{overflow-x:auto;position:relative;z-index:1}.FAM-tab{background:#eee;border:1px solid #ddd;border-left:none;border-top:none;position:relative;display:inline-block;width:120px;height:30px;line-height:30px;cursor:pointer}.FAM-tab:hover{background:#fff}.FAM-tab.FAM-tab-active{font-weight:700;background:#fff;cursor:default}.FAM-tab.FAM-tab-active:after{content:"";background:#39f;position:absolute;left:0;right:0;bottom:-1px;height:4px}.FAM-tab-name{font-size:12px;display:inline-block;padding:0 3px;width:80%;width:calc(100% - 16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-tab-close{font-size:16px;position:absolute;top:50%;margin-top:-8px!important;right:3px;cursor:pointer}.FAM-tab-close:hover{color:#f33}#FAM-version-status i{font-size:32px;vertical-align:-6px;margin-right:3px}#FAM-version-status i.fa-exclamation-circle{color:#f93}#FAM-creator-info{text-align:center;margin-top:30px}#FAM-creator-info i,#FAM-update-help i{font-size:24px;vertical-align:-3px}</style>');
}());
