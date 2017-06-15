!window.FAM && (function() {
  window.FAM = {

    // General Configuration of Forumactif Messenger
    // See : https://github.com/SethClydesdale/forumactif-messenger/wiki/Config
    config : {
      chat_page : '',
      chat_permission : 'all',
      main_title : 'Select a Group',
      embed : '',

      tabs : true,
      initial_tabs : [],

      refresh : 7500,
      timeout : 10*60*1000,
      flood_control : 5000,

      max_attachments : 10,

      ignore_announcements : false,
      ignore_firstpost : true,

      no_avatar : 'https://illiweb.com/fa/invision/pp-blank-thumb.png',
      no_name : 'Anonymous',

      lang : {
        loading : 'Loading...',
        idle : 'Forumactif Messenger has fallen asleep due to inactivity. Click here to start chatting again.',

        new_topic : 'New topic',
        start_topic : 'Start topic',

        msg_placeholder : 'Enter message',
        title_placeholder : 'Topic title',
        not_found : 'No forums or topics could be found.',
        not_found_offline : 'You may need to <a href="/login">login</a> or <a href="/register">register</a> to view this forum.',
        load_older : 'Load older messages',
        delete_message : 'Are you sure you want to delete this message?',
        actions_error : 'An error occurred while retreiving the message.',

        no_tabs_title : 'Open a new tab',
        no_tabs : 'Uh-oh! You have no tabs opened! Click here to open a new one.',
        no_tabs_initial : 'Would you like to open the initial startup tabs?',

        about_releases : 'Releases',
        about_latest : 'Latest Release',
        about_sync : 'Sync',
        about_update : 'Update',
        about_updated : 'Forumactif Messenger is up to date!',
        about_new_update : 'A new version of Forumactif Messenger is available!',
        about_update_info : 'Replace your current Forumactif Messenger script with the one below.<br>It should be applied in <strong>Admin Panel > Modules > JavaScript codes management</strong>.',
        about_help : 'How to Update',
        about_bug : 'Report Bug',

        settings_fullscreen : 'Full Screen : ',
        settings_width : 'Window Width : ',
        settings_height : 'Window Height : ',
        settings_default : 'Reset Default Settings',
        settings_default_confirm : 'Are you sure you want to restore Forumactif Messenger\'s default settings? Your personal settings will be lost.',
        settings_guide : 'View Settings Guide',

        search_view : 'View all results',
        search_searching : 'Searching topics for "{keywords}"...',
        search_no_results : 'No results were found for "{keywords}"',
        search_tip : 'Use the search bar above to find a topic.',
        search_help : 'View Search Guide',

        attach_image : 'Add an Image',
        attach_gif : 'Add a GIF',
        attach_video : 'Add a Video',
        attach_remove : 'Manage Attachments',
        attach_upload : 'Upload',
        attach_uploading : 'The image uploader is already open.',
        attach_searchYT : 'Search YouTube',
        attach_searchingYT : 'Youtube is already open.',
        attach_max : 'You have reached the maximum number of attachments for this message.',
        attach_success : 'Attachment Added!',
        attach_none : 'There are no attachments',

        giphy_search : 'Search for a GIF...',
        giphy_searching : 'Searching...',
        giphy_not_found : 'No results found.',

        tooltip_openFAM : 'Forumactif Messenger',
        tooltip_back : 'Click to go back',
        tooltip_menu : 'Open menu',
        tooltip_home : 'Home',
        tooltip_search : 'Search',
        tooltip_settings : 'Settings',
        tooltip_about : 'About',
        tooltip_attachments : 'Add attachment',
        tooltip_emoji : 'Add emoticon',
        tooltip_send : 'Send message',
        tooltip_msg_quote : 'Quote',
        tooltip_msg_edit : 'Edit',
        tooltip_msg_delete : 'Delete',

        error_sending : 'An error occurred that prevented your message from being sent. Do you want to resend it?',
        error_resend : 'Resend',
        error_delete : 'Delete',
        error_report : 'Report',

        guest : 'Guest',
        yes : 'Yes',
        no : 'No',
        send : 'Send',
        cancel : 'Cancel'
      }
    }, // config_end


    // toggles Forumactif Messenger
    toggle : function () {
      if (FAM.cache.chat.dataset.hidden == 'true') {
        FAM.cache.chat.dataset.hidden = false;

        if (!FAM.history.restore()) {
          FAM.tab.initial();
          FAM.tab.loaded = true;
        }

        if (FAM.fullscreen) {
          document.body.style.overflow = 'hidden';
        }

      } else {
        FAM.cache.chat.dataset.hidden = true;

        if (FAM.fullscreen) {
          document.body.style.overflow = '';
        }
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


    // abort ongoing requests
    clearRequest : function () {
      if (FAM.request) {
        if (!FAM.request.statusText) {
          FAM.request.abort();
        }

        delete FAM.request;
      }
    },


    // get the specified page and load the contents into FAM
    get : function (url, title, noHistory) {
      var type = /\/c\d+/.test(url) ? 'category' :
                 /\/f\d+/.test(url) ? 'forum' :
                 /\/t\d+/.test(url) ? 'topic' :
                 /\/search/.test(url) ? 'search' : 'category';

      // push new entry to history
      if (!noHistory) {
        FAM.history.update({
          url : url,
          title : title
        });
      }

      FAM.clearRequest(); // abort ongoing requests
      FAM.message.listener.stop(); // stop listening for message changes
      FAM.history.toggleBack(); // show / hide back button
      FAM.tab.title(title); // update the main title

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
        FAM.message.log = {};
      }

      // get the page
      FAM.request = $.get(url, function (data) {
        var a = $(FAM.select[type == 'topic' ? 'post' : 'forumtitle'], data),
            form = type == 'topic' ? $('form[action="/post"]', data)[0] : null,
            i = 0,
            j = a.length,
            html = '';

        // create message / forum structure
        for (; i < j; i++) {
          html += type == 'topic' ?
            FAM.message.log[a[i].className.replace(/.*?(post--\d+).*/, '$1')] = FAM.message.parse(a[i], i) :
            FAM.topic.parse(a[i]);
        }

        // add message actions if the opened url is a topic
        if (type == 'topic') {
          var postReply = $(FAM.select.post_reply, data)[0],
              back = $(FAM.select.page_back, data)[0];

          FAM.cache.content.innerHTML = (
            back ? // adds button for loading older messages
              '<button id="FAM-load-older" class="FAM-button" onclick="FAM.message.loadOlder(\'' + (back.tagName == 'A' ? back : back.parentNode).href + '\');" type="button">' + FAM.config.lang.load_older + '</button>'
              : ''
          ) + html;

          if (postReply) {
            FAM.cache.content.className += ' FAM-reply-open';
            FAM.cache.actions.innerHTML =
            '<button id="FAM-attachment" type="button" onclick="FAM.attachments.open(this);" title="' + FAM.config.lang.tooltip_attachments + '" type="button"><i class="fa fa-paperclip"></i><span id="FAM-attachment-total">0</span></button>'+
            '<button id="FAM-emoji" type="button" onclick="FAM.message.emoji(this);" title="' + FAM.config.lang.tooltip_emoji + '" type="button"><i class="fa fa-smile-o"></i></button>'+
            '<span id="FAM-msg-container">'+
              '<textarea id="FAM-msg" placeholder="' + FAM.config.lang.msg_placeholder + '" onkeydown="FAM.message.handleKeys(event);" onkeyup="FAM.message.validate(this.value);"></textarea>'+
              '<span id="FAM-timeout-bar"></span>'+
            '</span>'+
            '<button id="FAM-send" type="button" onclick="FAM.message.send();" data-disabled="true" title="' + FAM.config.lang.tooltip_send + '" type="button"><i class="fa fa-paper-plane"></i></button>'+
            ( form ? form.outerHTML.replace(/id=".*?"|name=".*?"/, '').replace('<form', '<form id="FAM-post-data" name="fampost" style="display:none"') : '<div id="FAM-post-data-placeholder"></div>' );

            // authorize the guest for replies
            if (!_userdata.session_logged_in) {
              FAM.message.replyPage = (FAM.fVersion == 5 ? postReply : postReply.parentNode).href;
              FAM.message.authorizeGuest();
            }
          } else {
            FAM.cache.actions.innerHTML = '';
          }

          FAM.message.scroll(); // scroll to the newest message
          FAM.message.listener.start(); // listen for new posts and changes to existing messages

          // parse servimg data for use in uploading
          var servImgData = {
            account : data.match(/servImgAccount = '(.*?)'/),
            id : data.match(/servImgId = '(.*?)'/),
            f : data.match(/servImgF = '(.*?)'/),
            mode : data.match(/servImgMode = '(.*?)'/)
          },
          authorization = 'multiupload.php?',
          denied = false, i;

          for (i in servImgData) {
            if (servImgData[i] && servImgData[i][0] && servImgData[i][1]) {
              authorization += i + '=' + servImgData[i][1] + '&';
            } else {
              denied = true;
              break;
            }
          }

          FAM.message.servImgData = denied ? '' : authorization;

        // standard forum / category view
        } else {
          var pagination = /forum|search/.test(type) ? $(FAM.select.pagination, data)[0] : null;

          FAM.cache.content.innerHTML = (
            pagination ?
            '<div class="FAM-pagination">' +
              (FAM.fVersion == 0 ? pagination.parentNode : pagination).innerHTML // insert pages
              .replace(/&nbsp;|•|<br>|,|:|<span class="page-sep">.*?<\/span>|<a.*?href=".*?mark=topics">.*?<\/a>|<a.*?href="javascript:Pagination\(\);"[^>]*?>.*?<\/a>|<a[^>]*?><img.*?><\/a>/g, '') // cleanup unnecessary elements
              .replace(/>\d+<\/(.*?)>/g, function (match, $1) {
                // adds event handler and class to page numbers
                return ' class="FAM-page-link"' + (
                  $1.toUpperCase() == 'A' ? ' onclick="FAM.get(this.href, \'' + title + '\'); return false;"' : ''
                ) + match;

              }).replace(/>\s+</g, '><') + // removes whitespace between tags
            '</div>' : ''
          ) + html ||
          '<div class="FAM-loading FAM-noclick">'+
            '<p class="FAM-clickable"><i class="fa fa-frown-o fa-3x"></i>' + FAM.config.lang.not_found + ( _userdata.session_logged_in ? '' : ' ' + FAM.config.lang.not_found_offline ) + '</p>'+
          '</div>';
          FAM.cache.actions.innerHTML = '';

          // add new topic icon if available
          if (type == 'forum') {
            var newTopic = $(FAM.select.new_topic, data)[0];

            if (newTopic) {
              FAM.cache.actions.innerHTML =
              '<span id="FAM-new-topic" class="fa-stack fa-2x" onclick="FAM.topic.create(\'' + ( FAM.fVersion == 5 ? newTopic : newTopic.parentNode ).href + '\');" title="' + FAM.config.lang.new_topic + '">'+
                '<i class="fa fa-circle fa-stack-2x"></i>'+
                '<i class="fa fa-plus fa-stack-1x fa-inverse"></i>'+
              '</span>';
            }
          }

        }

        FAM.clearRequest();
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


      // inserts the user @handle into the textarea after clicking a username
      mention : function (caller) {
        FAM.message.insert('@"' + caller.innerText + '"', true);
      },


      // interact with the specifed message
      interact : function (caller, post) {
        var old = {
          fn : caller.onclick,
          html : caller.innerHTML
        };

        caller.innerHTML = '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>';
        caller.onclick = null;


        $.get(post, function (data) {
          var form = $('form[action="/post"]', data)[0],
              mode = post.split('=').pop();

          caller.innerHTML = old.html;
          caller.onclick = old.fn;

          if (form) {

            switch (mode) {
              case 'quote' :
                FAM.message.insert(form.message.value);
                break;

              case 'editpost' :
                caller = $(caller).closest('.FAM-msg')[0];

                if (FAM.message.edit.placeholder) {
                  FAM.message.edit.cancel();
                }

                FAM.message.edit.form = form;
                FAM.message.edit.backup = caller.outerHTML;
                FAM.message.edit.placeholder = FAM.message.write(
                  '<textarea class="FAM-inputbox">' + form.message.value + '</textarea>'+
                  '<div class="FAM-row FAM-center FAM-inline-buttons">'+
                    '<button class="FAM-button" onclick="FAM.message.edit.confirm();">' + FAM.config.lang.send + '</button>'+
                    '<button class="FAM-button" onclick="FAM.message.edit.cancel();">' + FAM.config.lang.cancel + '</button>'+
                  '</div>',
                  'FAM-msg-editing',
                caller);

                break;

              case 'delete' :
                if (confirm(FAM.config.lang.delete_message)) {
                  caller = $(caller).closest('.FAM-msg')[0];
                  caller.className += ' FAM-msg-placeholder';
                  caller.querySelector('.FAM-msg-content').innerHTML = '<div class="FAM-msg-text"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></div>';

                  $.post('/post', $(form).serialize() + '&confirm=1', function () {
                    FAM.cache.content.removeChild(caller);
                    delete FAM.message.log['post--' + form.p.value];
                  });
                }
                break;
            }

          } else {
            alert(FAM.config.lang.actions_error);
          }
        });
      },


      // edit actions
      edit : {
        // send the updated message
        confirm : function () {
          FAM.message.backup = FAM.message.edit.placeholder.querySelector('.FAM-inputbox').value;
          FAM.message.send(true, FAM.message.edit.form, FAM.message.edit.placeholder);
          delete FAM.message.edit.placeholder;
        },

        // cancel message editing
        cancel : function () {
          FAM.message.edit.placeholder.insertAdjacentHTML('afterend', FAM.message.edit.backup);
          FAM.cache.content.removeChild(FAM.message.edit.placeholder);
          delete FAM.message.edit.placeholder;
        }
      },


      // write a custom message into the chat for alerts and placeholders
      write : function (message, id, replacement) {
        var msg = document.createElement('DIV');
        msg.className = 'FAM-msg FAM-my-msg ' + (id || '');
        msg.innerHTML =
        '<div class="FAM-msg-avatar">' + _userdata.avatar + '</div>'+
        '<div class="FAM-msg-box">'+
          '<div class="FAM-msg-content">'+
            '<div class="FAM-msg-text">' + (message || '') + '</div>'+
          '</div>'+
          '<div class="FAM-msg-date"></div>'+
        '</div>';

        if (replacement) {
          FAM.cache.content.insertBefore(msg, replacement);
          FAM.cache.content.removeChild(replacement);
        } else {
          FAM.cache.content.appendChild(msg);
          FAM.message.scroll();
        }

        return msg;
      },


      // handles key events for the message field
      handleKeys : function (e) {
        if (e) {
          var key = e.key || e.which || e.keyCode;

          // handle ENTER key
          if ({
            'Enter' : 1,
            '13' : 1
          }[key] && !e.shiftKey) {
            FAM.cache.actions.querySelector('#FAM-send').dataset.disabled != 'true' && FAM.message.send();
            e.preventDefault();
          }

        }
      },


      // validate a message to make sure there's enough content to post it
      validate : function (message) {
        message = message || FAM.attachments.list.length || null;

        var send = FAM.cache.actions.querySelector('#FAM-send'),
            disabled = send.dataset.disabled == 'true';

        if (message && disabled) {
          send.dataset.disabled = false;

        } else if (!message && !disabled) {
          send.dataset.disabled = true;
        }
      },


      // send a message to the topic
      send : function (resend, form, replacement) {
        if (FAM.message.sending) {
          return false;
        } else {
          FAM.message.sending = true;
        }

        FAM.message.clearError(); // removes error messages

        var msg = document.getElementById('FAM-msg'),
            placeholder = FAM.message.write('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>', 'FAM-msg-placeholder', replacement), // show placeholder message until the sent message is ready
            val = resend ? FAM.message.backup : msg.value,
            attachments = '',
            i = 0,
            j = FAM.attachments.list.length;

        // add attachments to message value
        if (!resend) {
          if (j) {
            for (; i < j; i++) {
              attachments += '[tr][td]' + FAM.attachments.list[i] + '[/td][/tr]';
            }

            val += '\n[table class="FAM-attachment"]' + attachments + '[/table]';

            FAM.attachments.list = [];
            FAM.cache.actions.querySelector('#FAM-attachment-total').innerText = 0;
          }

          // reset message field value
          msg.value = '';
          FAM.message.validate();
          FAM.message.backup = val; // backup the current message in case of errors
        }

        // post the message to the topic
        $.post('/post', $(form || document.fampost).serialize().replace(
          /message=.*?(?:&|$)/,
          'message=' + FAM.encode(val) + '&'
        ) + '&post=1&prevent_post=1', function (data) {
          var success = $('a[href^="/viewtopic"]', data)[0],
              captcha = $('#funcaptcha', data);

          // get the new message and remove the placeholder + sending restriction
          if (success) {
            FAM.message.check(function () {

              // update message replacement
              if (replacement) {
                $.get(success.href, function (data) {
                  var post = $('.post--' + form.p.value, data)[0];

                  if (post) {
                    placeholder.insertAdjacentHTML('afterend', FAM.message.log[form.p.value] = FAM.message.parse(post, 1));
                    FAM.cache.content.removeChild(placeholder);
                  }
                });

                // remove placeholder and add new message
              } else {
                FAM.cache.content.removeChild(placeholder);
                FAM.message.scroll();
              }

              // wait the specified time before sending another message
              // and display an indicator so the user knows when the timeout is over
              var bar = FAM.cache.actions.querySelector('#FAM-timeout-bar'),
                  progress = FAM.config.flood_control;

              bar.style.height = '100%';

              FAM.message.timeoutBar = setInterval(function () {
                if ((progress -= 50) <= 0 || !FAM.message.sending) {
                  clearInterval(FAM.message.timeoutBar);

                  FAM.message.sending = false;
                  bar.style.height = '0%';

                } else {
                  bar.style.height = progress / FAM.config.flood_control * 100 + '%';
                }
              }, 40);

              // update form data for the guest
              if (!_userdata.session_logged_in) {
                FAM.message.authorizeGuest();
              }
            });

          // insert the captcha form if it's what prevented the message from being sent
          } else if (captcha.length) {
            FAM.cache.content.removeChild(placeholder);

            // cleanup the noscript captcha form for usage
            FAM.message.error = FAM.message.write(
              '<div class="FAM-center"><i class="fa fa-exclamation-circle fa-2x"></i></div>'+
              captcha.closest('form')[0].outerHTML.replace(/<noscript>(.*?)<\/noscript>/g, function (match, $1) {
                return $1.replace(/&lt;|&gt;/g, function (match) {
                  return {
                    '&lt;' : '<',
                    '&gt;' : '>'
                  }[match];
                });
              })
              .replace(/class="gensmall"/g, '')
              .replace(/<div style="[^"]*?">/, '<div class="FAM-row">')
              .replace(/<input([^>]*?)style="[^"]*?"([^>]*?)>/, '<input class="FAM-inputbox" $1 $2>')
              .replace(/<input[^>]*?type="submit"[^>]*?value="(.*?)"[^>]*?>/, '<button class="FAM-button" type="button">$1</button>')
              .replace('<form', '<form class="FAM-center FAM-captcha"'),
            'FAM-msg-error');

            // submits the captcha form
            FAM.message.error.querySelector('.FAM-button').onclick = function () {
              FAM.message.sending = false;
              FAM.message.send(true, $(this).closest('form').clone()[0], replacement);
              return false;
            };

          // ask to resend if the message was not sent successfully
          } else {
            FAM.message.sending = false;
            FAM.cache.content.removeChild(placeholder);
            FAM.message.error = FAM.message.write(
              '<div class="FAM-center"><i class="fa fa-exclamation-circle fa-2x"></i></div>'+
              FAM.config.lang.error_sending+
              '<textarea id="FAM-resend-message" class="FAM-inputbox">' + FAM.message.backup + '</textarea>'+
              '<a onclick="FAM.message.send(true);">' + FAM.config.lang.error_resend + '</a> | '+
              '<a onclick="FAM.message.clearError();">' + FAM.config.lang.error_delete + '</a>'+
              '<a href="https://github.com/SethClydesdale/forumactif-messenger/wiki/Reporting-Bugs" target="_blank" style="float:right;">' + FAM.config.lang.error_report + '</a>',
            'FAM-msg-error');

            console.log(data); // log response data for debugging
          }
        });
      },

      // removes unsent message error
      clearError : function () {
        if (FAM.message.error) {
          if (FAM.cache.content.querySelector('.FAM-msg-error')) {
            var txt = FAM.message.error.querySelector('#FAM-resend-message');
            if (txt) {
              FAM.message.backup = txt.value;
            }

            FAM.cache.content.removeChild(FAM.message.error);
          }

          delete FAM.message.error;
        }
      },


      // loads older messages
      loadOlder : function (page) {
        var button = FAM.cache.content.querySelector('#FAM-load-older');

        button.setAttribute('onclick', '');
        button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i>';

        $.get(page, function (data) {
          var back = $(FAM.select.page_back, data)[0],
              post = $('.post[class*="post--"]', data),
              html = '',
              i = 0,
              j = post.length,
              loadId = +new Date,
              pid;

          // parse messages
          for (; i < j; i++) {
            pid = post[i].className.replace(/.*?(post--\d+).*/, '$1');

            if (!FAM.message.log[pid]) {
              html += FAM.message.log[pid] = FAM.message.parse(post[i], i);
            }
          }

          // restore the load more button functionality or hide it depending if more pages can be loaded
          if (back) {
            button.setAttribute('onclick', "FAM.message.loadOlder('" + ( back.tagName == 'A' ? back : back.parentNode ).href + "')");
            button.innerHTML = FAM.config.lang.load_older;

          } else {
            button.style.display = 'none';
          }

          // add older messages to the message list
          button.insertAdjacentHTML('afterend', html + '<div id="page-load-' + loadId + '"></div>');
          FAM.message.scroll(FAM.cache.content.querySelector('#page-load-' + loadId).previousSibling.offsetTop - 60); // scroll to the bottom of the old messages
        });
      },


      // returns the parsed message
      parse : function (post, index) {
        if (FAM.config.ignore_firstpost && index == 0) {
          var indicator = $(FAM.select.post_message + ' > strong:first-child', post)[0];

          if (indicator && /&nbsp;/.test(indicator.innerHTML)) {
            return '';
          }
        }

        var avatar, name, pLink, group, date, msg, quote, edit, remove;

        quote = $('a[href$="mode=quote"]', post)[0];
        edit = $('a[href$="mode=editpost"]', post)[0];
        remove = $('a[href$="mode=delete"]', post)[0];

        avatar = $(FAM.select.post_avatar, post)[0];

        // get username
        name = $(FAM.select.post_name, post)[0];

        // check if the user link is available
        pLink = name ? name.querySelector('a[href]') : null;
        pLink = pLink ? '<a href="' + pLink.href + '">' : null;

        // check if the user is in a group
        group = name ? name.getElementsByTagName('SPAN')[0] : null;
        group = group ? '<span style="' + group.getAttribute('style') + '"><strong>' : null;

        // check if the username is available
        name = name ? name.innerText : FAM.config.no_name;

        date = $(FAM.select.post_date, post)[0];
        msg = $(FAM.select.post_message, post)[0];

        return '<div class="FAM-msg' + ( (name == _userdata.username || !_userdata.session_logged_in && name == FAM.config.lang.guest) ? ' FAM-my-msg' : '' ) + ' ' + post.className.replace(/.*?(post--\d+).*/, '$1') + '">'+
          '<div class="FAM-msg-avatar">'+
            (pLink ? pLink : '')+
            '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
            (pLink ? '</a>' : '')+
          '</div>'+

          '<div class="FAM-msg-box">'+
            '<div class="FAM-msg-name">'+
              '<span class="FAM-name-mention" onclick="FAM.message.mention(this);">'+
                (pLink ? pLink : '').replace('<a', '<a onclick="return false;"')+
                  (group ? group : '')+
                    name+
                  (group ? '</strong></span>' : '')+
                (pLink ? '</a>' : '')+
              '</span>'+
            '</div>'+
            '<div class="FAM-msg-content">'+
              '<div class="FAM-msg-text">' + (
                msg ? msg.innerHTML
                // replace break tags with line breaks
                // and remove unnecessary white-space / breaks at the beginning / end of messages
                .replace(/<br>/g, '\n')
                .replace(/^\n+|\n+$|^\s+|\s+$/g, '')
                .replace(/\n/g, '<br>')

                // add unique classes to codeboxes and quotes
                .replace(/class="(.*?)"/g, function (match, $1) {
                  return $1.indexOf('FAM-') == -1 ? 'class="FAM-' + $1.split(' ').join(' FAM-') + '"' : match;
                })
                .replace(/<blockquote>/g, '<blockquote class="FAM-codebox">')

                // add events to media so they open the media viewer on click
                .replace(/<img/g, '<img onclick="FAM.modal.open(this);"')
                .replace(/<table class="FAM-attachment">([\s\S]*?)<\/table>/, function (match, $1) {
                  return '<table class="FAM-attachment">' + $1.replace(/<td/g, '<td onclick="FAM.modal.open(this);"') + '</table>';
                }) : ''
              ) + '</div>'+
              '<div class="FAM-msg-actions">'+
                (quote ? '<span class="FAM-msg-button" onclick="FAM.message.interact(this, \'' + quote.href + '\');" title="' + FAM.config.lang.tooltip_msg_quote + '"><i class="fa fa-quote-left"></i></span>' : '' )+
                (edit ? '<span class="FAM-msg-button" onclick="FAM.message.interact(this, \'' + edit.href + '\');" title="' + FAM.config.lang.tooltip_msg_edit + '"><i class="fa fa-pencil"></i></span>' : '' )+
                (remove ? '<span class="FAM-msg-button" onclick="FAM.message.interact(this, \'' + remove.href + '\');" title="' + FAM.config.lang.tooltip_msg_delete + '"><i class="fa fa-times"></i></span>' : '' )+
              '</div>'+
            '</div>'+
            '<div class="FAM-msg-date">' + ( date ? (FAM.fVersion == 5 ? date.innerHTML.split('<').shift() : date.innerHTML.split('>').pop()).replace(/^\s+|\s+$/g, '') : '' ) + '</div>'+
          '</div>'+
        '</div>';
      },


      // check for new messages / edits and update the message list
      check : function (callback) {
        FAM.request = $.get(FAM.history.log['tab' + FAM.tab.active][FAM.history.log['tab' + FAM.tab.active].length - 1].url, function (data) {

          for (var a = $('.post[class*="post--"]', data), i = 0, j = a.length, pid, msg, row; i < j; i++) {
            pid = a[i].className.replace(/.*?(post--\d+).*/, '$1');
            msg = FAM.message.parse(a[i], i);

            if (msg) {
              // check for edited messages and update them
              if (FAM.message.log[pid]) {
                if (FAM.message.log[pid] != msg) {
                  FAM.message.log[pid] = msg;
                  row = FAM.cache.content.querySelector('.FAM-msg.' + pid);

                  if (row) {
                    row.outerHTML = msg;
                  }

                }

              // add in new messages if there are any
              } else {
                FAM.message.log[pid] = msg;
                FAM.cache.content.insertAdjacentHTML('beforeend', msg);
                FAM.message.scroll();
              }
            }

          }

          // optional callback to execute, mainly used for send()
          if (typeof callback === 'function') {
            callback();
          }

          FAM.clearRequest();
        });
      },


      // methods that listen for message changes and user activity
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
              '<div id="FAM-idle" class="FAM-loading" onclick="FAM.message.listener.resume();">'+
                '<p><i class="fa fa-moon-o fa-3x"></i>' + FAM.config.lang.idle + '</p>'+
              '</div>'
            );
          }, FAM.config.timeout > 15*60*1000 ? 15*60*1000 : FAM.config.timeout);
        },


        // resume listening after a period of inactivity
        resume : function () {
          var idle = FAM.cache.chat.querySelector('#FAM-idle');

          if (idle) {
            FAM.cache.chat.removeChild(idle);
          }

          FAM.message.check(FAM.message.listener.start);
        }
      },


      // scroll to the newest message or specified amount
      scroll : function (amount) {
        FAM.cache.content.scrollTop = amount || FAM.cache.content.lastChild.offsetTop - 60;
      },


      // call the emoji list to the specified element (caller)
      emoji : function (caller) {
        var active = FAM.cache.actions.querySelector('#FAM-emoji-list'),
            selector;

        if (active) {
          active.style.visibility = active.style.visibility == 'hidden' ? 'visible' : 'hidden';

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

      },


      // gets the form data for guests
      authorizeGuest : function () {
        $.get(FAM.message.replyPage, function (data) {
          var form = $('form[action="/post"]', data)[0];

          if (form) {
            FAM.cache.actions.querySelector('#FAM-post-data-placeholder').innerHTML = form.outerHTML.replace(/id=".*?"|name=".*?"/, '').replace('<form', '<form id="FAM-post-data" name="fampost" style="display:none"');
            document.fampost.username.value = _userdata.username;
          }
        });
      }
    },


    // attachment methods and data
    attachments : {
      list : [], // list of attachments to add

      // opens the attachment drop down
      open : function (caller) {
        var active = FAM.cache.actions.querySelector('#FAM-attach-options'),
            attach;

        if (active) {
          active.style.visibility = active.style.visibility == 'hidden' ? 'visible' : 'hidden';

        } else {
          attach = document.createElement('DIV');
          attach.id = 'FAM-attach-options';
          attach.className = 'FAM-dropdown';
          attach.innerHTML =
          '<div class="FAM-dropdown-title">' + FAM.config.lang.tooltip_attachments + '</div>'+
          '<div class="FAM-block-option" onclick="FAM.attachments.addImage();"><span class="FAM-option-icon"><i class="fa fa-camera"></i></span> ' + FAM.config.lang.attach_image + '</div>'+
          '<div class="FAM-block-option" onclick="FAM.attachments.addGIF();"><span class="FAM-option-icon FAM-text-icon">GIF</span> ' + FAM.config.lang.attach_gif + '</div>'+
          '<div class="FAM-block-option" onclick="FAM.attachments.addVideo();"><span class="FAM-option-icon"><i class="fa fa-film"></i></span> ' + FAM.config.lang.attach_video + '</div>'+
          '<div class="FAM-block-option" onclick="FAM.attachments.manage();"><span class="FAM-option-icon"><i class="fa fa-wrench"></i></span> ' + FAM.config.lang.attach_remove + '</div>';

          caller.parentNode.insertBefore(attach, caller);
        }
      },


      // completely deletes the old attachment drop down
      close : function () {
        var attach = FAM.cache.actions.querySelector('#FAM-attach-options');

        if (attach) {
          FAM.cache.actions.removeChild(attach);
        }
      },


      // go back to the attachments page
      back : function () {
        FAM.attachments.close();
        FAM.attachments.open(FAM.cache.actions.querySelector('#FAM-attachment'));
      },


      // adds an attachment to the attachment list
      add : function (caller, tag) {
        if (FAM.attachments.list.length >= FAM.config.max_attachments) {
          return alert(FAM.config.lang.attach_max);
        }

        var value = caller.tagName == 'INPUT' ? caller.value :
                    caller.tagName == 'IMG' ? caller.src :
                    null;

        // change tags and edit values based on video host
        if (tag == 'video') {
          if (/youtube/.test(value)) {
            tag = 'youtube';

          } else if (/dailymotion/.test(value)) {
            tag = 'dailymotion';
            value = value.split('_')[0].split('/').pop();

          } else {
            tag = 'url';
          }
        }

        if (value) {
          FAM.attachments.list.push('[' + tag + ']' + ( /giphy/.test(value) ? value.replace('200w.gif', 'giphy.gif') : value) + '[/' + tag + ']');
          FAM.message.validate();

          if (caller.tagName == 'INPUT') {
            caller.value = '';
          }

          FAM.cache.actions.querySelector('#FAM-attachment-total').innerText = FAM.attachments.list.length;

          // show success notification so the user knows the attachment was added
          if (!FAM.cache.actions.querySelector('#FAM-attach-success')) {
            FAM.cache.actions.querySelector('#FAM-attach-options').insertAdjacentHTML('beforeend',
              '<div id="FAM-attach-success"><i class="fa fa-check-circle"></i>' + FAM.config.lang.attach_success + '</div>'
            );

            // remove success message after 300ms
            setTimeout(function () {
              var success = FAM.cache.actions.querySelector('#FAM-attach-success');

              if (success) {
                success.parentNode.removeChild(success);
              }
            }, 300);
          }
        }
      },


      // remove an attachment from the attachment list
      remove : function (caller) {
        var row = caller.parentNode,
            parent = row.parentNode,
            index = Array.prototype.indexOf.call(parent.children, row);

        FAM.attachments.list.splice(index, 1);
        FAM.message.validate();
        FAM.cache.actions.querySelector('#FAM-attachment-total').innerText = FAM.attachments.list.length;

        parent.removeChild(row);

        if (!parent.children.length) {
          parent.innerHTML = '<p class="FAM-center">' + FAM.config.lang.attach_none + '</p>';
        }
      },


      // update the selected attachment when its value changes
      update : function (caller) {
        var thumb = caller.previousSibling,
            row = caller.parentNode,
            index = Array.prototype.indexOf.call(row.parentNode.children, row),
            val = caller.value,
            tag = 'img';

        if (thumb.tagName == 'IMG') {
          thumb.src = val.replace('giphy.gif', '100w_s.gif');

        } else {
          if (/youtube/.test(val)) {
            tag = 'youtube';

          } else if (/dailymotion/.test(val)) {
            tag = 'dailymotion';
            val = val.split('_')[0].split('/').pop();

          } else {
            tag = 'url';
          }

          thumb.href = (tag == 'dailymotion' ? 'http://www.dailymotion.com/video/' : '') + val;
          thumb.firstChild.className = thumb.firstChild.className.replace(/fa-.*/,
            'fa-' + (tag == 'dailymotion' ? 'film' : tag == 'youtube' ? 'youtube-play' : 'external-link')
          );
        }

        FAM.attachments.list[index] = '[' + tag + ']' + val + '[/' + tag + ']';
      },


      // opens the image manager for attaching images
      addImage : function () {
        var attach = FAM.cache.actions.querySelector('#FAM-attach-options');

        attach.innerHTML =
        '<div class="FAM-dropdown-inner">'+
          '<div class="FAM-dropdown-title"><span class="FAM-toolbar-button FAM-dropdown-back" onclick="FAM.attachments.back();"><i class="fa fa-arrow-left"></i></span>' + FAM.config.lang.attach_image + '</div>'+
          '<div class="FAM-button-input FAM-row">'+
            '<input type="text" class="FAM-inputbox" placeholder="' + FAM.config.lang.attach_image + '">'+
            '<button class="FAM-button" onclick="FAM.attachments.add(this.previousSibling, \'img\');" type="button"><i class="fa fa-plus"></i></button>'+
          '</div>'+
          '<div class="FAM-row">'+
            '<button id="FAM-upload" class="FAM-button" onclick="FAM.attachments.upload();" type="button"><i class="fa fa-upload"></i> ' + FAM.config.lang.attach_upload + '</button>'+
          '</div>'+
        '</div>';
      },


      // opens Giphy search for attaching a GIF
      addGIF : function () {
        var attach = FAM.cache.actions.querySelector('#FAM-attach-options');

        attach.innerHTML =
        '<div class="FAM-dropdown-inner">'+
          '<div class="FAM-dropdown-title"><span class="FAM-toolbar-button FAM-dropdown-back" onclick="FAM.attachments.back();"><i class="fa fa-arrow-left"></i></span>' + FAM.config.lang.attach_gif + '</div>'+
          '<div class="FAM-row">'+
            '<input type="text" id="FAM-giphy-search" class="FAM-inputbox" onkeyup="FAM.attachments.giphy.keyHandler(this, event);" placeholder="' + FAM.config.lang.giphy_search + '">'+
          '</div>'+
          '<div class="FAM-row">'+
            '<div id="FAM-giphy-results" onscroll="FAM.attachments.giphy.scrolling(this);"></div>'+
            '<div id="FAM-giphy-mark"></div>'+
          '</div>'+
        '</div>';

        attach.querySelector('#FAM-giphy-search').focus();
      },


      // opens the video manager for attaching videos
      addVideo : function () {
        var attach = FAM.cache.actions.querySelector('#FAM-attach-options');

        attach.innerHTML =
        '<div class="FAM-dropdown-inner">'+
          '<div class="FAM-dropdown-title"><span class="FAM-toolbar-button FAM-dropdown-back" onclick="FAM.attachments.back();"><i class="fa fa-arrow-left"></i></span>' + FAM.config.lang.attach_video + '</div>'+
          '<div class="FAM-button-input FAM-row">'+
            '<input type="text" class="FAM-inputbox" placeholder="' + FAM.config.lang.attach_video + '">'+
            '<button class="FAM-button" onclick="FAM.attachments.add(this.previousSibling, \'video\');" type="button"><i class="fa fa-plus"></i></button>'+
          '</div>'+
          '<div class="FAM-row">'+
            '<button id="FAM-youtube" class="FAM-button" onclick="FAM.attachments.openYoutube();" type="button"><i class="fa fa-search"></i> ' + FAM.config.lang.attach_searchYT + '</button>'+
          '</div>'+
        '</div>';
      },


      // opens the attachment manager so the user can delete attachments
      manage : function () {
        var attach = FAM.cache.actions.querySelector('#FAM-attach-options'),
            i = 0,
            j = FAM.attachments.list.length,
            attachments = '',
            manager,
            dmotion,
            val;

        attach.innerHTML =
        '<div class="FAM-dropdown-inner">'+
          '<div class="FAM-dropdown-title"><span class="FAM-toolbar-button FAM-dropdown-back" onclick="FAM.attachments.back();"><i class="fa fa-arrow-left"></i></span>' + FAM.config.lang.attach_remove + '</div>'+
          '<div id="FAM-attachment-manager"></div>'+
        '</div>';

        manager = attach.querySelector('#FAM-attachment-manager');

        if (j) {
          for (attachments = ''; i < j; i++) {
            val = FAM.attachments.list[i].replace(/\[.*?\]/g, '');
            dmotion = ( /dailymotion/.test(FAM.attachments.list[i]) ? 'http://www.dailymotion.com/video/' : '' );

            attachments +=
            '<div id="FAM-attachment-' + i + '" class="FAM-row">'+
              (/\[img\]/.test(FAM.attachments.list[i]) ?
                '<img class="FAM-attachment-thumb" src="' + val.replace('giphy.gif', '100w_s.gif') + '" alt="attachment ' + i + '" onmouseover="this.src=this.src.replace(\'100w_s.gif\', \'100w.gif\')" onmouseout="this.src=this.src.replace(\'100w.gif\', \'100w_s.gif\')">' :
                '<a href="' + dmotion + val + '" class="FAM-attachment-thumb" target="_blank"><i class="fa fa-' + ( dmotion ? 'film' : /youtube/.test(val) ? 'youtube-play' : 'external-link' ) + '"></i></a>'
              )+
              '<input class="FAM-inputbox" type="text" value="' + dmotion + val + '" onkeyup="FAM.attachments.update(this);">'+
              '<span class="FAM-attachment-delete fa-stack" onclick="FAM.attachments.remove(this);">'+
                '<i class="fa fa-circle fa-stack-2x"></i>'+
                '<i class="fa fa-times fa-stack-1x fa-inverse"></i>'+
              '</span>'+
            '</div>';
          }

        } else {
          attachments = '<p class="FAM-center">' + FAM.config.lang.attach_none + '</p>';
        }

        manager.innerHTML = attachments;
      },


      // opens youtube in a new window
      openYoutube : function (caller) {
        if (FAM.attachments.youtube && !FAM.attachments.youtube.closed) {
          return alert(FAM.config.lang.attach_searchingYT);
        }

        FAM.attachments.youtube = window.open('https://www.youtube.com/', '', 'scrollbars=yes,resizable=yes,width=780,height=530');
      },


      // call the servimg image uploader
      upload : function () {
        if (FAM.attachments.uploader && !FAM.attachments.uploader.closed) {
          return alert(FAM.config.lang.attach_uploading);
        }

        FAM.attachments.uploader = window.open('https://www.servimg.com/' + FAM.message.servImgData, '', 'scrollbars=yes,resizable=yes,width=780,height=530');
      },


      // giphy search methods and data
      giphy : {
        key : 'dc6zaTOxFJmzC', // PUBLIC BETA KEY
        limit : 26, // max image results
        delay : 200, // delay before searches commence (200ms)

        // search for a GIPHY gif
        search : function (query) {
          if (FAM.attachments.giphy.timeout) {
            FAM.attachments.giphy.abort(); // abort ongoing searches and requests
          }

          if (query) {

            // set a small timeout in case the user is still typing
            FAM.attachments.giphy.timeout = setTimeout(function () {
              FAM.attachments.giphy.reset(true, FAM.config.lang.giphy_searching);
              FAM.attachments.giphy.query = encodeURIComponent(query);

              FAM.attachments.giphy.request = $.get('http://api.giphy.com/v1/gifs/search?q=' + FAM.attachments.giphy.query + '&limit=' + FAM.attachments.giphy.limit + '&rating=pg-13&api_key=' + FAM.attachments.giphy.key, function(data) {
                // update global data such as page offsets for scrolling
                FAM.attachments.giphy.request = null;
                FAM.attachments.giphy.offset = data.pagination.offset + FAM.attachments.giphy.limit;
                FAM.attachments.giphy.offset_total = data.pagination.total_count;

                FAM.attachments.giphy.reset(true); // reset HTML content
                FAM.attachments.giphy.addGIF(data); // send data to be parsed
              });

            }, FAM.attachments.giphy.delay);

          } else {
            FAM.attachments.giphy.reset(true);
          }
        },


        // abort ongoing searches and requests
        abort : function () {
          if (FAM.attachments.giphy.timeout) {
            clearInterval(FAM.attachments.giphy.timeout);
            FAM.attachments.giphy.timeout = null;
          }

          if (FAM.attachments.giphy.request) {
            FAM.attachments.giphy.request.abort();
            FAM.attachments.giphy.request = null;
          }
        },


        // add gifs to the result list
        addGIF : function (data, loadMore) {
          // setup data and begin parsing results
          var gif = data.data,
              i = 0,
              j = gif.length,
              list = $('<div class="FAM-giphy-imagelist" />')[0];

          if (j) {
            for (; i < j; i++) {
              list.appendChild($('<img id="' + gif[i].id + '" src="' + gif[i].images.fixed_width.url + '" />').click(function() {
                FAM.attachments.add(this, 'img');
              })[0]);
            }
          } else if (!loadMore) {
            FAM.attachments.giphy.reset(true, FAM.config.lang.giphy_not_found);
          }

          // add results to the result list
          $('#FAM-giphy-results', FAM.cache.actions).append(list);
        },


        // listen to the scrolling so we can add more gifs when the user reaches the bottom
        scrolling : function (that) {
          if (that.scrollHeight - that.scrollTop === that.clientHeight) {
            FAM.attachments.giphy.loadMore();
          }
        },


        // load more results once the user has scrolled through the last results
        loadMore : function () {
          if (FAM.attachments.giphy.offset < FAM.attachments.giphy.offset_total) {
            FAM.attachments.giphy.request = $.get('http://api.giphy.com/v1/gifs/search?q=' + FAM.attachments.giphy.query + '&offset=' + FAM.attachments.giphy.offset + '&limit=' + FAM.attachments.giphy.limit + '&rating=pg-13&api_key=' + FAM.attachments.giphy.key, function (data) {
              FAM.attachments.giphy.request = null;
              FAM.attachments.giphy.offset = data.pagination.offset + FAM.attachments.giphy.limit;
              FAM.attachments.giphy.offset_total = data.pagination.total_count;

              FAM.attachments.giphy.addGIF(data, true); // send data to be parsed
            });
          }
        },


        // reset the dropdown fields
        reset : function (resultsOnly, newContent) {
          $('#FAM-giphy-results', FAM.cache.actions).html(newContent ? newContent : '');

          if (!resultsOnly) {
            $('#FAM-giphy-search', FAM.cache.actions).val('');
          }
        },


        // key handler for search input
        keyHandler : function (caller, e) {
          var k = e.which || e.keyCode;

          // ignore specific key inputs to prevent unnecessary requests
          if (k && (k == 16 || k == 17 || k == 18 || k == 20 || k == 37 || k == 38 || k == 39 || k == 40)) {
            return;
          } else {
            FAM.attachments.giphy.search(caller.value);
          }
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

        FAM.clearRequest();
        FAM.history.toggleBack();
        FAM.tab.title(FAM.config.lang.new_topic);

        FAM.cache.content.className = 'FAM-viewing-newtopic';
        FAM.cache.content.innerHTML =
        '<div class="FAM-loading">'+
          '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
          '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
        '</div>';
        FAM.cache.actions.innerHTML = '';

        FAM.request = $.get(url, function (data) {
          var form = $('form[action="/post"]', data)[0];

          FAM.cache.content.innerHTML =
          '<div id="FAM-newtopic-box" class="FAM-content-block">'+
            '<form name="fampost">'+
              '<div class="FAM-row"><input id="FAM-topic-subject" class="FAM-inputbox" type="text" placeholder="' + FAM.config.lang.title_placeholder + '" name="subject"></div>'+
              '<div class="FAM-row"><textarea id="FAM-topic-message" class="FAM-inputbox" name="message" placeholder="' + FAM.config.lang.msg_placeholder + '"></textarea></div>'+
              '<div class="FAM-row FAM-center"><button class="FAM-button" type="button" onclick="FAM.topic.publish()" type="button"><i class="fa fa-share"></i> ' + FAM.config.lang.start_topic + '</button></div>'+
              '<div style="display:none">' + $('input[name="auth[]"]', form)[0].parentNode.innerHTML + '</div>'+
            '</form>'+
          '</div>';

          FAM.clearRequest();
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
      },


      // returns parsed forum topics and categories
      parse : function (forumtitle) {
        if (FAM.config.ignore_announcements && $(forumtitle).closest(FAM.select.forum_info).find((FAM.fVersion == 4 ? '.topic-type ' : '> ') + ' strong').length) {
          return '';
        }

        var row = $(forumtitle).closest(FAM.select.row);

        if (!row.find('.AD_LastPA')[0]) { // exclude ad forums
          row = row[0];

          var avatar = $('.lastpost-avatar img', row)[0],
          date = $(FAM.select.row_date, row)[0],
          type2 = /c\d+-/.test(forumtitle.href) ? 'category' :
                  /f\d+-/.test(forumtitle.href) ? 'forum' :
                  /t\d+-/.test(forumtitle.href) ? 'topic' : 'unknown';

          // remove dfn texts on phpbb3 and modernbb
          if (date && (FAM.fVersion == 1 || FAM.fVersion == 5) && /dfn/.test(date.innerHTML)) {
            date.querySelector('dfn').innerText = '';
          }

          // build the markup for forum and topic containers
          return '<div class="FAM-chat FAM-' + type2 + '" onclick="FAM.get(\'' + forumtitle.href.replace(/\?.*$/, '') + ( type2 == 'topic' ? '?view=newest' : '' ) + '\', this.querySelector(\'.FAM-chat-title\').innerText);">'+
            '<span class="FAM-chat-icon ' + ( $('a[href$="view=newest"]', row)[0] ? 'FAM-new-post' : '' ) + ' fa-stack fa-lg">'+
              '<i class="fa fa-circle fa-stack-2x"></i>'+
              '<i class="fa fa-' + ( type2 == 'topic' ? 'comments' : 'folder' ) + ' fa-stack-1x fa-inverse"></i>'+
            '</span>'+

            '<div class="FAM-chat-avatar">'+
              '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
            '</div>'+

            '<div class="FAM-chat-title">' + forumtitle.innerText + '</div>'+

            '<div class="FAM-chat-date">' + ( date ? date.innerText.split('\n').join('<span class="FAM-separator"></span>').replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ') : '' ) + '</div>'+
          '</div>';
        } else {
          return '';
        }
      }
    },


    // github pages
    page : {
      // information about Forumactif Messenger
      about : {
        open : function (noHistory) {
          FAM.page.setup('about', noHistory);

          FAM.request = $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/pages/about.html', function (data) {
            FAM.cache.content.innerHTML = FAM.page.parse(data, {
              client_version : '<a href="https://github.com/SethClydesdale/forumactif-messenger/releases/tag/' + FAM.version + '" target="_blank">' + FAM.version + '</a>'

            }).replace('<textarea', '<textarea style="display:none;"');

            var status = FAM.cache.content.querySelector('#FAM-version-status'),
                icon = FAM.cache.content.querySelector('#FAM-version-status-icon');

            if (FAM.version == FAM.cache.content.querySelector('#FAM-version-github').innerHTML) {
              status.innerHTML = FAM.config.lang.about_updated;
              icon.innerHTML = '<i class="fa fa-check-circle"></i>';

            } else {
              status.innerHTML = FAM.config.lang.about_new_update;
              icon.innerHTML = '<i class="fa fa-exclamation-circle"></i>';
              FAM.cache.content.querySelector('#FAM-update').innerHTML = '<i class="fa fa-arrow-circle-up"></i> ' + FAM.config.lang.about_update;
            }

            FAM.clearRequest();
          });
        },


        // get the latest version of Forumactif Messenger from Github
        update : function () {
          FAM.cache.content.querySelector('#FAM-update').outerHTML = '<p id="FAM-update" style="text-align:center;"><i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i></p>';

          $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/fam.js', function (data) {
            var config = data.replace(/[\s\S]*?(config.*?:.*?\{[\s\S]*?\},)[\s\S]*/, '$1').replace(/config.*?:/, 'window.fam_new_config = ').replace(/,$/, ';'),
                lang = data.replace(/[\s\S]*?(lang.*?:.*?\{[\s\S]*?\})[\s\S]*/, '$1').replace(/lang.*?:/, 'window.fam_new_lang = '),
                script = document.createElement('SCRIPT'),
                update = FAM.cache.content.querySelector('#FAM-update-code'),
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

            FAM.cache.content.querySelector('#FAM-update').outerHTML = '<div class="FAM-row">' + FAM.config.lang.about_update_info + '</div>';

            update.value = data.replace(/config.*?:.*?\{[\s\S]*?\},/, 'config : ' + JSON.stringify(FAM.config, null, 2) + ',');
            update.style.display = '';
          });
        }
      },


      // general settings for Forumactif Messenger that the user can personalize
      settings : {
        // opens the settings page
        open : function (noHistory) {
          FAM.page.setup('settings', noHistory);

          FAM.request = $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/pages/settings.html', function (data) {
            var settings =  window.JSON && window.localStorage && localStorage.fam_settings ? JSON.parse(localStorage.fam_settings) : {};

            FAM.cache.content.innerHTML = FAM.page.parse(data, {
              fam_fullscreen : settings.fam_fullscreen || '',
              fam_window_width : settings.fam_window_width || '',
              fam_window_height : settings.fam_window_height || ''
            });

            FAM.clearRequest();
          });
        },


        // update FAM settings when changes are made
        update : function (caller, noCache) {
          var id = caller ? caller.id.replace(/-/g, '_').toLowerCase() : '';

          // take action depending on the setting that was changed
          switch (id) {
            case 'fam_fullscreen' :
              if (caller.checked) {
                FAM.fullscreen = true;
                FAM.cache.chat.className += ' FAM-fullscreen';
                document.body.style.overflow = 'hidden';

              } else {
                FAM.fullscreen = false;
                FAM.cache.chat.className = FAM.cache.chat.className.replace('FAM-fullscreen', '');
                document.body.style.overflow = '';
              }
              break;

            case 'fam_window_width' :
              FAM.cache.chat.style.width = caller.value ? (caller.value + '%') : '';
              break;

            case 'fam_window_height' :
              FAM.cache.chat.style.height = caller.value ? (caller.value + '%') : '';
              break;
          }

          // cache user settings to localStorage
          if (!noCache && window.JSON && window.localStorage) {
            var settings = localStorage.fam_settings ? JSON.parse(localStorage.fam_settings) : {};

            settings[id] = caller.type == 'checkbox' ? caller.checked ? 'checked' : '' : caller.value;

            localStorage.fam_settings = JSON.stringify(settings);
          }
        },


        // reset FAM settings to their default states
        reset : function () {
          if (confirm(FAM.config.lang.settings_default_confirm)) {
            // reset fields to their default value
            FAM.cache.content.querySelector('#FAM-fullscreen').checked = false;
            FAM.cache.content.querySelector('#FAM-window-width').value = '';
            FAM.cache.content.querySelector('#FAM-window-height').value = '';

            // update the settings
            for (var a = FAM.cache.content.querySelectorAll('input'), i = 0, j = a.length; i < j; i++) {
              FAM.page.settings.update(a[i], true);
            }

            // delete locally cached settings
            if (window.localStorage && localStorage.fam_settings) {
              localStorage.removeItem('fam_settings');
            }
          }
        },


        // applies cached settings on startup
        apply : function () {
          if (window.JSON && window.localStorage && localStorage.fam_settings) {
            var settings = JSON.parse(localStorage.fam_settings), i;

            for (i in settings) {
              switch (i) {
                case 'fam_fullscreen' :
                  if (settings[i] == 'checked' && !FAM.config.embed) {
                    FAM.cache.chat.className += ' FAM-fullscreen';
                    FAM.fullscreen = true;
                  }
                  break;

                case 'fam_window_width' :
                  FAM.cache.chat.style.width = settings[i] ? settings[i] + '%' : '';
                  break;

                case 'fam_window_height' :
                  FAM.cache.chat.style.height = settings[i] ? settings[i] + '%' : '';
                  break;
              }
            }

          }
        }

      },


      // search page that allows the user to search for specific topics
      search : {
        // opens the search page
        open : function (noHistory) {
          FAM.page.setup('search', noHistory);

          FAM.request = $.get('https://raw.githubusercontent.com/SethClydesdale/forumactif-messenger/master/pages/search.html', function (data) {
            FAM.cache.content.innerHTML = FAM.page.parse(data);
            FAM.page.search.button = FAM.cache.content.querySelector('#FAM-search-view');
            FAM.page.search.results = FAM.cache.content.querySelector('#FAM-search-results');
            FAM.clearRequest();
          });
        },


        // performs an AJAX search with the given string
        query : function (str) {
          FAM.page.search.clear();
          FAM.page.search.data = {
            URI : '/search?search_keywords=' + encodeURIComponent(str) + '*',
            key : str
          };

          // only perform search with 3 letter (or greater) words
          if (str.length >= 3) {
            FAM.page.search.results.innerHTML = '<p class="FAM-center">' + FAM.config.lang.search_searching.replace('{keywords}', FAM.page.search.data.key) + '</p>';

            // show view search button
            if (FAM.page.search.button.style.display == 'none') {
              FAM.page.search.button.style.display = '';
            }

            // wait a few seconds before sending the request
            FAM.page.search.wait = setTimeout(function () {

              // perform a search with the specified keywords
              FAM.page.search.request = $.get(FAM.page.search.data.URI, function (data) {
                var a = $(FAM.select.forumtitle, data),
                    i = 0,
                    j = a.length,
                    html = '';

                for (; i < j; i++) {
                  html += FAM.topic.parse(a[i]);
                }

                FAM.page.search.results.innerHTML = html ? html : '<p class="FAM-center">' + FAM.config.lang.search_no_results.replace('{keywords}', FAM.page.search.data.key) + '</p>';
              });

            }, 100);

          } else if (FAM.page.search.button.style.display != 'none') {
            FAM.page.search.button.style.display = 'none';
            FAM.page.search.results.innerHTML = '<p class="FAM-center">' + FAM.config.lang.search_tip + '</p>';
          }

        },


        // bring up the search results as a normal page
        get : function () {
          FAM.page.search.clear();
          FAM.get(FAM.page.search.data.URI, FAM.config.lang.tooltip_search + ' - ' + FAM.page.search.data.key);
        },


        // clear ongoing queues and searches
        clear : function () {
          // clear ongoing timeout
          if (FAM.page.search.wait) {
            clearTimeout(FAM.page.search.wait);
            delete FAM.page.search.wait;
          }

          // clear ongoing requests
          if (FAM.page.search.request) {
            FAM.page.search.request.abort();
            delete FAM.page.search.request;
          }
        }
      },


      // sets up various settings for custom pages
      setup : function (pageName, noHistory) {
        if (!noHistory) {
          FAM.history.update({
            url : '',
            title : FAM.config.lang['tooltip_' + pageName],
            recall : {
              path : 'page.' + pageName.replace(/\s/g, '_') + '.open',
              args : [true]
            }
          });
        }

        FAM.clearRequest();
        FAM.history.toggleBack();
        FAM.message.listener.stop();
        FAM.tab.title(FAM.config.lang['tooltip_' + pageName]);

        FAM.cache.content.className = 'FAM-viewing-github';
        FAM.cache.content.innerHTML =
        '<div class="FAM-loading">'+
          '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
          '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
        '</div>';
      },


      // parses a page retreived from github
      parse : function (data, vars) {
        var i;
        data = data.replace(/\n\s*?</g, '<').replace(/<a/g, '<a target="_blank"');
        vars = vars || {};

        for (i in vars) {
          data = data.replace('{' + i + '}', vars[i]);
        }

        for (i in FAM.config.lang) {
          data = data.replace('{' + i + '}', FAM.config.lang[i]);
        }

        return data;
      }

    },


    // history methods and data
    history : {
      log : {}, // log history so the user can go back


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

          if (!FAM.tab.loaded) {
            var data = JSON.parse(localStorage.fam_data), i;

            FAM.tab.total = data.total;
            FAM.history.log = data.history;

            for (i in FAM.history.log) {
              FAM.tab.add(i.replace('tab', ''), FAM.history.log[i][FAM.history.log[i].length - 1].title);
            }

            if (data.active) {
              FAM.tab.focus(data.active);
            } else {
              FAM.tab.initial();
            }

            FAM.tab.loaded = true;
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


    // tab methods and data
    tab : {
      active : 0, // currently active tab
      total : 0, // total tabs created (used for assigning unique ids)

      // sets up the initial tabs for Forumactif Messenger
      initial : function () {
        FAM.tab.add(); // initial chat_page tab

        for (var i = 0, j = FAM.config.initial_tabs.length, id, title; i < j; i++) {
          id = ++FAM.tab.total; // unique tab id

          // initial history entry
          FAM.history.log['tab' + id] = [{
            url : FAM.config.chat_page,
            title : FAM.config.main_title
          }];

          // custom history entry
          FAM.config.initial_tabs[i].url = FAM.config.initial_tabs[i].url || '';
          FAM.config.initial_tabs[i].title = FAM.config.initial_tabs[i].title || 'Tab ' + id;
          FAM.history.log['tab' + id].push(FAM.config.initial_tabs[i]);

          // creates a new tab w/the custom history entry via the "restore" method
          FAM.tab.add(id, FAM.config.initial_tabs[i].title);
        }
      },


      // add a new tab
      add : function (restore, title) {
        var id = restore || ++FAM.tab.total;

        // general tab markup
        FAM.cache.tabs.insertAdjacentHTML('beforeend',
          '<div id="FAM-tab-' + id + '" class="FAM-tab">'+
            '<span class="FAM-tab-name" onclick="FAM.tab.focus(' + id + ')">' + ( title ? title : FAM.config.lang.loading ) + '</span>'+
            '<i class="FAM-tab-close fa fa-times" onclick="FAM.tab.close(' + id + ')"></i>'+
          '</div>'
        );

        // doesn't log history or focus the tab if it was "restored" from localStorage
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
          '<div id="FAM-no-tabs" class="FAM-loading" onclick="FAM.tab.prompt(this);">'+
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

          if (history.html) {
            FAM.cache.content.innerHTML = history.html;
            FAM.clearRequest();
          } else {
            history.recall ? FAM.history.recall(history.recall) : FAM.get(history.url, history.title, true);
          }

          FAM.history.save();

        } else {
          FAM.get(FAM.config.chat_page || '/forum', FAM.config.main_title);
        }
      },


      // bring up a prompt that asks the user if they want to load the initial tabs
      prompt : function (caller) {
        if (FAM.config.initial_tabs.length) {
          caller.style.cursor = 'auto';
          caller.onclick = null;
          caller.innerHTML =
          '<div class="FAM-row">'+
            '<p><i class="fa fa-question-circle fa-3x"></i>' + FAM.config.lang.no_tabs_initial + '</p>'+
            '<div class="FAM-inline-buttons">'+
              '<button class="FAM-button" onclick="FAM.tab.initial();" type="button">' + FAM.config.lang.yes + '</button>'+
              '<button class="FAM-button" onclick="FAM.tab.add();" type="button">' + FAM.config.lang.no + '</button>'+
            '</div>'+
          '</div>';

        } else {
          FAM.tab.add();
        }
      },


      // changes the main title and focused tab title
      title : function (string) {
        FAM.cache.toolbar.querySelector('.FAM-maintitle').innerText = string;
        FAM.cache.tabs.querySelector('#FAM-tab-' + FAM.tab.active + ' .FAM-tab-name').innerText = string;
      }
    },


    // modal methods and data
    modal : {
      // opens the modal
      open : function (caller) {
        // closes media modal if it's already open
        if (FAM.modal.box) {
          FAM.modal.close();
        }

        // selects the media element inside the attachment cell
        if (caller.tagName == 'TD') {
          caller = caller.querySelector('img, iframe, a') || caller;
        }

        var box = document.createElement('DIV'),
            attachments = $(caller).closest('.FAM-attachment')[0];

        box.id = 'FAM-modal';
        box.innerHTML =
        '<div id="FAM-modal-overlay"></div>'+
        '<div id="FAM-modal-content">'+
          '<div id="FAM-media-viewer">'+
            '<i id="FAM-modal-prev" class="FAM-modal-controls FAM-modal-arrows fa fa-arrow-left fa-2x" onclick="FAM.modal.showMedia(-1, true);" style="display:none;"></i>'+
            '<i id="FAM-modal-next" class="FAM-modal-controls FAM-modal-arrows fa fa-arrow-right fa-2x" onclick="FAM.modal.showMedia(+1, true);" style="display:none;"></i>'+
            '<i id="FAM-modal-close" class="FAM-modal-controls fa fa-times fa-2x" onclick="FAM.modal.close();"></i>'+
            '<a id="FAM-view-media" class="FAM-modal-controls" href="#" target="_blank"><i class="fa fa-external-link-square fa-2x"></i></a>'+
            '<div id="FAM-media-list"></div>'+
          '</div>'+
        '</div>';

        FAM.modal.box = box;
        FAM.modal.list = box.querySelector('#FAM-media-list');
        FAM.modal.view = box.querySelector('#FAM-view-media');
        FAM.modal.media = [];
        FAM.modal.mediaIndex = 0;

        if (attachments) {
          for (var a = attachments.querySelectorAll('img, iframe, a'), i = 0, j = a.length; i < j; i++) {
            FAM.modal.addMedia(a[i]);

            if (a[i] == caller) {
              FAM.modal.mediaIndex = i;
            }
          }

        } else {
          FAM.modal.addMedia(caller);
        }

        if (FAM.modal.media.length) {
          FAM.modal.showMedia(FAM.modal.mediaIndex);
          document.body.appendChild(FAM.modal.box);

          if (!FAM.fullscreen) {
            document.body.style.overflow = 'hidden';
          }

        } else {
          delete FAM.modal.box;
        }
      },


      // closes the modal
      close : function () {
        if (FAM.modal.box) {
          document.body.removeChild(FAM.modal.box);

          if (!FAM.fullscreen) {
            document.body.style.overflow = '';
          }

          delete FAM.modal.box;
        }
      },


      // adds media to the media list
      addMedia : function (media) {
        media = media.cloneNode(true);
        media.style.display = 'none';
        media.onclick = null;

        FAM.modal.media.push(media);
        FAM.modal.list.appendChild(media);
      },


      // show the specified media
      showMedia : function (id, arrow) {
        var back = FAM.modal.box.querySelector('#FAM-modal-prev'),
            next = FAM.modal.box.querySelector('#FAM-modal-next'),
            max = FAM.modal.media.length - 1;

        FAM.modal.media[FAM.modal.mediaIndex].style.display = 'none'; // hide the old media
        FAM.modal.mediaIndex = arrow ? FAM.modal.mediaIndex + id : id; // update media index

        // hide arrows and reset index if it has reached the max or min value
        if (FAM.modal.mediaIndex >= max) {
          next.style.display = 'none';
          FAM.modal.mediaIndex = max;
        } else if (FAM.modal.mediaIndex <= 0) {
          back.style.display = 'none';
          FAM.modal.mediaIndex = 0;
        }

        // show arrows if they're hidden
        if (next.style.display == 'none' && FAM.modal.mediaIndex < max) {
          next.style.display = '';
        }

        if (back.style.display == 'none' && FAM.modal.mediaIndex > 0) {
          back.style.display = '';
        }

        // update view media link
        FAM.modal.view.href = FAM.modal.media[FAM.modal.mediaIndex][/IMG|IFRAME/.test(FAM.modal.media[FAM.modal.mediaIndex].tagName) ? 'src' : 'href'];

        // show newly active media
        FAM.modal.media[FAM.modal.mediaIndex].style.display = '';
      }
    },


    // initial setup of FAM
    init : function () {
      var initialized = false;

      // add view=newest query to topic urls if it's not there
      if (/\/t\d+/.test(FAM.config.chat_page) && !/view=newest/.test(FAM.config.chat_page)) {
        FAM.config.chat_page = FAM.config.chat_page.replace(/#\d+$/, '') + '?view=newest';
      }

      // builds the necessary chat elements
      function build () {
        // delete FAM if the user does not meet the required permissions
        if (!{
          'all' : 1,
          'member' : _userdata.session_logged_in,
          'staff' : _userdata.user_level
        }[FAM.config.chat_permission.toLowerCase()]) {
          return delete FAM;
        }

        var button = document.createElement('A'),
            chat = document.createElement('DIV'),
            frag = document.createDocumentFragment(),
            embed = FAM.config.embed ? document.querySelector(FAM.config.embed) : null;

        chat.id = 'FAM';
        chat.className = FAM.config.embed ? 'FAM-embedded' : '';
        chat.dataset.hidden = FAM.config.embed ? false : true;
        chat.innerHTML =
        '<div id="FAM-toolbar">'+
          '<div id="FAM-toolbar-inner">'+
            '<span id="FAM-back" class="FAM-toolbar-button" onclick="FAM.history.back()" style="display:none" title="' + FAM.config.lang.tooltip_back + '"><i class="fa fa-arrow-left"></i></span>'+
            '<h1 class="FAM-maintitle"></h1>'+
            '<span id="FAM-menu-toggle" class="FAM-toolbar-button" title="' + FAM.config.lang.tooltip_menu + '"><i class="fa fa-ellipsis-h"></i></span>'+
            '<div id="FAM-menu" style="visibility:hidden;">'+
              '<div class="FAM-menu-option" onclick="FAM.history.back(true);" title="' + FAM.config.lang.tooltip_home + '"><i class="fa fa-home"></i></div>'+
              '<div class="FAM-menu-option" onclick="FAM.page.search.open();" title="' + FAM.config.lang.tooltip_search + '"><i class="fa fa-search"></i></div>'+
              '<div class="FAM-menu-option" onclick="FAM.page.settings.open();" title="' + FAM.config.lang.tooltip_settings + '"><i class="fa fa-cog"></i></div>'+
              '<div class="FAM-menu-option" onclick="FAM.page.about.open();" title="' + FAM.config.lang.tooltip_about + '"><i class="fa fa-question-circle"></i></div>'+
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
          menu.style.visibility = menu.style.visibility == 'hidden' ? 'visible' : 'hidden';
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
        FAM.select = {
          forumtitle : 'a.forum' + ( FAM.fVersion == 0 ? 'link' : 'title' ) + ', a.topictitle',
          post : '.post[class*="post--"]',

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

          forum_info : [
            '.topictitle', // phpbb2
            '.dterm', // phpbb3
            '.tdtopics', // punbb
            '.row1', // invision
            '.forum-info', // forumactif edge
            '.topic-title-container' // modernbb
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
            '#i_reply', // phpbb2
            '.i_reply', // phpbb3
            '.i_reply', // punbb
            '.i_reply', // invision
            '.i_reply', // forumactif edge
            'a.ion-reply[href$="mode=reply"]' // modernbb
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
          ][FAM.fVersion],

          pagination : [
            'a[href="javascript:Pagination();"]', // phpbb2
            '.pagination:not(strong)', // phpbb3
            'p.paging', // punbb
            'div.pagination', // invision
            '.pagination:not(strong)', // forumactif edge
            '.pagination:not(strong)' // modernbb
          ][FAM.fVersion],

          page_back : [
            '.pagination .sprite-arrow_subsilver_left', // phpbb2
            '.pag-img:first-child', // phpbb3
            '.sprite-arrow_prosilver_left', // punbb
            '.sprite-arrow_prosilver_left', // invision
            '.pag-img:first-child', // forumactif edge
            '.pag-img:first-child' // modernbb
          ][FAM.fVersion]
        };

        // FAM styles
        // NOTE : this is getting pretty big.. we should consider looking for a CDN.
        $('head').append('<style type="text/css">@import url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css);#modernbb #FAM i.fa,#modernbb #FAM-button i.fa,#modernbb #FAM-send{margin:initial;vertical-align:initial}#FAM p{margin:12px 0}#FAM a{color:#06d;text-decoration:none}#FAM a:hover{color:#04a;text-decoration:underline}#FAM a:active{color:#028}#FAM,#FAM *{box-sizing:border-box}#FAM *{transition:0ms}#FAM{color:#333;font-size:13px;font-family:Arial,sans-serif;background:#fff;border:1px solid #ddd;position:fixed;height:70%;width:40%;min-height:400px;min-width:300px;right:3px;z-index:99999;visibility:visible;opacity:1;bottom:35px;transition:500ms}#FAM[data-hidden=true]{visibility:hidden;opacity:0;bottom:-100%}#FAM.FAM-embedded{position:relative;bottom:0;right:0;width:100%;height:500px;margin:12px auto;z-index:1}#FAM.FAM-fullscreen{position:fixed;right:0!important;bottom:0!important;margin:0!important;height:100%!important;width:100%!important;z-index:99999}#FAM-button,#FAM-toolbar{color:#fff;background:#39f}#FAM-button{font-size:18px;text-align:center;position:fixed;width:30px;right:3px;bottom:3px;cursor:pointer;z-index:99999;transition-property:right;transition-duration:500ms;height:30px}#FAM-button i{line-height:30px}#FAM-button:hover{background-color:#28e}#FAM-button:active{background-color:#17d}#FAM.FAM-fullscreen[data-hidden=false]+#FAM-button{background:0 0;top:5px;right:35px;bottom:auto}#FAM.FAM-fullscreen[data-hidden=false]+#FAM-button:hover,.FAM-toolbar-button i:hover{color:#eee}#FAM.FAM-fullscreen[data-hidden=false]+#FAM-button:active,.FAM-toolbar-button i:active{color:#ddd}#FAM-toolbar{border-bottom:1px solid #28e;height:40px;margin:-1px -1px 0}.FAM-maintitle{color:#fff;font-size:18px;text-align:center;width:70%;margin:0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-toolbar-button{color:#fff;font-size:24px;position:absolute;top:-1px;height:40px;cursor:pointer}#FAM-toolbar,.FAM-toolbar-button i{line-height:40px}#FAM-back{left:10px}#FAM-menu-toggle{right:10px}#FAM-menu{color:#666;background:#fff;border:1px solid #ccc;position:absolute;right:-1px;top:39px;min-width:75px;z-index:2}.FAM-menu-option{font-size:30px;text-align:center;padding:4px;cursor:pointer}.FAM-menu-option:hover{color:#333}.FAM-menu-option:active{color:#000}#FAM-back[style*=none]~#FAM-menu .FAM-menu-option:first-child,.FAM-msg-text ol>br:first-child,.FAM-msg-text ul>br:first-child{display:none}#FAM-content{height:90%;height:calc(100% - 69px);overflow-y:auto;overflow-x:hidden}#FAM-content.FAM-reply-open{height:calc(100% - 110px)}#FAM-tab-container[style*=none]+#FAM-content{height:calc(100% - 39px)}#FAM-tab-container[style*=none]+#FAM-content.FAM-reply-open{height:calc(100% - 80px)}.FAM-content-block{font-size:14px;padding:12px}.FAM-loading,.FAM-loading p{font-size:18px;font-weight:700}.FAM-loading{display:flex;justify-content:center;align-items:center;text-align:center;position:absolute;top:0;left:0;right:0;bottom:0}.FAM-loading i{display:block;margin-bottom:12px}#FAM-no-tabs{cursor:pointer}#FAM-idle,.FAM-button{color:#fff;cursor:pointer}#FAM-idle{background:rgba(0,0,0,.7);z-index:10;transition:300ms}#FAM-idle:hover{background:rgba(0,0,0,.6)}.FAM-button{font-size:16px;font-weight:700;text-transform:uppercase;background:#39f;border:none;border-radius:4px;display:block;height:40px;padding:0 12px;margin:3px auto;outline:none}.FAM-button:hover{background:#28e}.FAM-button:active{background:#17d}.FAM-inline-buttons .FAM-button{display:inline-block;margin:3px}#FAM .FAM-inputbox{color:#333;font-size:14px;font-family:Arial,sans-serif;background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px;width:100%;vertical-align:baseline;cursor:text;outline:none}#FAM textarea.FAM-inputbox{height:150px;resize:none}#FAM .FAM-inputbox:hover{border-color:#ccc}#FAM .FAM-inputbox:focus{border-color:#39f}#FAM .FAM-button-input .FAM-inputbox{width:79%;width:calc(100% - 40px);height:40px;margin:0;border-radius:4px 0 0 4px}#FAM .FAM-button-input .FAM-button{font-size:24px;vertical-align:-4px;width:40px;height:40px;display:inline-block;margin:0;padding:0;border-radius:0 4px 4px 0}.FAM-title{font-size:24px;font-weight:700;text-transform:uppercase;margin-bottom:12px}.FAM-title a{text-decoration:none!important}.FAM-title i{font-size:36px;vertical-align:-2px;margin-right:3px}#FAM .FAM-connected-buttons a{color:#333;background:#fff;border:1px solid #ddd;display:inline-block;height:30px;line-height:28px;padding:0 12px;margin-left:-1px;text-decoration:none}#FAM .FAM-connected-buttons a:hover{background:#eee;border-color:#ccc;position:relative}#FAM .FAM-connected-buttons a:active{background:#ddd;border-color:#bbb;position:relative}#FAM .FAM-connected-buttons>a:first-child,#FAM .FAM-connected-buttons>span:first-child>a{border-radius:4px 0 0 4px;margin-left:0}#FAM .FAM-connected-buttons>a:last-child,#FAM .FAM-connected-buttons>span:last-child>a{border-radius:0 4px 4px 0}#FAM .FAM-connected-buttons i{font-size:20px;margin-right:3px;vertical-align:-2px}.FAM-label{font-weight:700;text-align:right;display:inline-block;width:30%;padding-right:6px;margin:0}.FAM-label-value{display:inline-block;width:70%}#FAM .FAM-label-value .FAM-inputbox{width:60%}.FAM-center{text-align:center}.FAM-right{text-align:right}.FAM-row{margin:12px 0}.FAM-noclick{pointer-events:none}.FAM-clickable{pointer-events:all}.FAM-separator:after{content:" ";color:#ccc}.FAM-forum .FAM-separator:after{content:" | "}#FAM ::-webkit-scrollbar{width:8px;height:8px}#FAM ::-webkit-scrollbar-track{background-color:#ddd}#FAM ::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,.1);border:none}#FAM ::-webkit-scrollbar-button:single-button{height:0;width:0}#FAM ::-webkit-scrollbar-thumb:hover{background-color:rgba(0,0,0,.2)}#FAM ::-webkit-scrollbar-thumb:active{background-color:rgba(0,0,0,.3)}#FAM-actions{height:40px;border-top:1px solid #ddd;display:none}.FAM-viewing-forum+#FAM-actions,.FAM-viewing-topic+#FAM-actions{display:block}.FAM-viewing-forum+#FAM-actions{height:0}#FAM-new-topic{position:absolute;right:8px;bottom:3px;cursor:pointer}#FAM-new-topic .fa-plus{line-height:57px}#FAM-new-topic .fa-circle{color:#39f}#FAM-new-topic:hover .fa-circle{color:#28e}#FAM-new-topic:active .fa-circle{color:#17d}#FAM-actions>button{color:#333;font-size:18px;background:#fff;border:none;border-left:1px solid #ddd;height:40px;width:40px;cursor:pointer;outline:none}#FAM-actions>button:hover{background:#eee}#FAM-actions>button:active{background:#ddd}#FAM-actions>button[data-disabled=true]{pointer-events:none}#FAM-actions>button[data-disabled=true]>*{opacity:.5}#FAM-actions>button#FAM-attachment{border:none;position:relative}#FAM-attachment-total{color:#fff;font-size:12px;font-weight:700;background:#39f;border-radius:4px;position:absolute;bottom:1px;left:1px;padding:1px 3px}#FAM-attach-success,.FAM-dropdown-title{color:#fff;font-weight:700;text-align:center;height:40px;line-height:40px;padding:0 6px}#FAM-attach-success{background:#8b5;position:absolute;top:-1px;left:-1px;right:-1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px}#FAM-attach-success i{font-size:26px;margin-right:6px;vertical-align:-3px}#FAM-actions .FAM-dropdown{background:#fff;border:1px solid #ddd;position:absolute;left:0;bottom:40px;width:300px;height:400px;z-index:2}.FAM-dropdown .FAM-dropdown-inner{padding:6px}.FAM-dropdown-title{font-size:18px;background:#39f;margin:-1px -1px 0}.FAM-dropdown-back{left:3px}.FAM-dropdown-inner .FAM-dropdown-title{margin:-7px -7px 12px}.FAM-block-option{color:#666;font-size:16px;font-weight:700;border-bottom:1px solid #ddd;width:100%;height:40px;line-height:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.FAM-block-option:hover{color:#333;background:#eee}.FAM-block-option:active{color:#000;background:#ddd}.FAM-option-icon{font-size:20px;font-weight:400;text-align:center;display:inline-block;width:50px;height:40px;line-height:40px;float:left}.FAM-option-icon i{line-height:40px}.FAM-option-icon.FAM-text-icon{font-size:18px;font-weight:700;font-stretch:condensed}#FAM-giphy-results{height:260px;margin:10px auto;text-align:center;overflow-x:hidden;overflow-y:auto}.FAM-giphy-imagelist{line-height:0;column-count:2;column-gap:3px}.FAM-giphy-imagelist img{width:100%;margin-bottom:3px;cursor:pointer}#FAM #FAM-giphy-mark{background:url(http://i35.servimg.com/u/f35/18/21/60/73/powere11.png) no-repeat 50% 50%;height:22px;width:100%}#FAM-attachment-manager{height:340px;overflow-y:auto;overflow-x:hidden}#FAM-attachment-manager .FAM-inputbox{width:65%}.FAM-attachment-thumb{text-align:center;border:1px solid #ddd;border-radius:4px;display:inline-block;width:50px;height:50px;margin-right:6px;object-fit:cover;vertical-align:-20px}a.FAM-attachment-thumb{vertical-align:-5px}.FAM-attachment-thumb i{font-size:24px;line-height:50px}.FAM-attachment-delete{margin-left:6px;cursor:pointer}.FAM-attachment-delete:hover .fa-circle{color:#f33}#FAM-msg{color:#333;font-size:14px;font-family:Arial,sans-serif;background:0 0;border:none;height:40px;width:100%;margin:0;padding:6px;outline:none;resize:none}#FAM-msg-container{border-left:1px solid #ddd;display:inline-block;height:40px;width:calc(100% - 120px);vertical-align:top;position:relative}#FAM-timeout-bar{background:#ccc;position:absolute;left:0;bottom:0;width:5px;z-index:-1}.FAM-chat{color:#333;border-bottom:2px solid #ddd;position:relative;padding:12px;height:80px;cursor:pointer}.FAM-chat:hover{background-color:#eee}.FAM-chat-icon{position:absolute;left:1px;bottom:0;z-index:1}.FAM-chat-icon .fa-circle{color:#999}.FAM-chat-icon.FAM-new-post .fa-circle{color:#39f}.FAM-chat-avatar{position:absolute;left:10px;top:50%;margin-top:-20px;height:40px;width:40px;overflow:hidden}.FAM-chat-avatar img,.FAM-msg-avatar img{height:100%;width:100%}.FAM-chat-date,.FAM-chat-title{position:absolute;left:0;width:100%;padding:0 12px 0 60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-chat-title{font-size:14px;font-weight:700;top:20px}.FAM-chat-date{bottom:20px}.FAM-pagination{text-align:center;border-bottom:2px solid #ddd}#FAM a.FAM-page-link,.FAM-page-link{color:#fff;font-size:18px;font-weight:700;text-decoration:none;background:#39f;display:inline-block;height:25px;line-height:26px;padding:0 8px;margin:3px 1px}#FAM a.FAM-page-link:hover{background:#28e}#FAM a.FAM-page-link:active{background:#17d}b.FAM-page-link,strong.FAM-page-link{background:#999}.FAM-msg{position:relative;padding:12px}.FAM-msg:after{content:"";display:table;clear:both}.FAM-msg-avatar{height:40px;width:40px;margin-top:16px;overflow:hidden;float:left}.FAM-my-msg .FAM-msg-avatar{margin-top:0;float:right}.FAM-msg-box{float:right;width:80%;width:calc(100% - 40px);padding-left:15px}.FAM-my-msg .FAM-msg-box{float:left;padding:0 15px 0 0}.FAM-msg-content{color:#000;background:#ddd;border-radius:4px;padding:8px 12px;margin:3px 0;min-height:36px;max-width:80%;position:relative;float:left}.FAM-msg-editing .FAM-msg-content{width:100%}.FAM-msg-content:before{content:"";height:0;width:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:10px solid #ddd;position:absolute;top:13px;left:-10px}.FAM-my-msg .FAM-msg-content{color:#fff;background:#07c;float:right}.FAM-my-msg .FAM-msg-content:before{border-right:none;border-left:10px solid #07c;top:12px;left:auto;right:-10px}.FAM-msg-text{font-size:14px;line-height:20px;white-space:pre-wrap;word-wrap:break-word}.FAM-msg-text .fa-circle-o-notch{font-size:20px}#FAM .FAM-msg-text a{color:inherit;text-decoration:underline;cursor:pointer}#FAM .FAM-msg-text a:hover{text-decoration:none}.FAM-msg-text *{max-width:100%}.FAM-msg-text img{max-height:200px}.FAM-msg-date{clear:both}.FAM-msg-date,.FAM-msg-name{font-size:12px;padding:0 3px;width:100%}.FAM-name-mention{cursor:pointer}.FAM-my-msg .FAM-msg-name{display:none}.FAM-my-msg .FAM-msg-date{text-align:right}.FAM-msg-error .FAM-msg-content{background:#f33}.FAM-msg-error .FAM-msg-content:before{border-left-color:#f33}.FAM-msg-text .FAM-attachment,.FAM-msg-text .FAM-attachment *{display:block}.FAM-msg-text .FAM-attachment tbody{line-height:0;column-count:2;column-gap:5px}.FAM-msg-text .FAM-attachment tr{background:#fff;width:100%;max-height:200px;padding:3px;margin-bottom:5px;border-radius:4px;overflow:hidden;-webkit-column-break-inside:avoid;page-break-inside:avoid;break-inside:avoid}.FAM-msg-text .FAM-attachment tr:only-child{column-span:all;margin:0}.FAM-msg-text .FAM-attachment td{color:#333;font-size:18px;min-height:20px;line-height:20px;position:relative;white-space:nowrap;border-radius:4px;max-height:194px}.FAM-msg-text .FAM-attachment td *{width:100%;object-fit:cover;border-radius:4px;max-height:194px}#FAM .FAM-msg-actions{background:inherit;border-radius:4px;position:absolute;left:0;bottom:0;height:25px;white-space:nowrap;visibility:hidden;opacity:0;transition:300ms}#FAM .FAM-msg:hover .FAM-msg-actions{visibility:visible;opacity:1;bottom:-20px}#FAM .FAM-my-msg .FAM-msg-actions{left:auto;right:0}.FAM-msg-button{font-size:16px;padding:0 6px;cursor:pointer}.FAM-msg-button:hover{opacity:.7}.FAM-msg-button i{line-height:25px}.FAM-msg-text .FAM-attachment td:after{content:"";position:absolute;top:0;left:0;right:0;bottom:0;cursor:pointer}#FAM [onclick="FAM.modal.open(this);"]{cursor:pointer}.FAM-msg-text .FAM-attachment td,.FAM-msg-text .FAM-attachment td a{overflow:hidden;text-overflow:ellipsis}.FAM-msg-text ol,.FAM-msg-text ul{padding-left:30px;margin:12px 0}.FAM-codebox,.FAM-spoiler{color:#333;background:#fff;border:1px solid #ccc;border-radius:4px;padding:0;margin:12px 0;overflow:hidden}.FAM-codebox cite a,.FAM-codebox dt a{color:#333!important}.FAM-codebox cite,.FAM-codebox dt,.FAM-spoiler dt{color:#333;font-size:14px;font-weight:700;background:#ccc;padding:3px;margin:0;cursor:auto!important}.FAM-codebox dd,.FAM-spoiler dd{padding:3px;margin:0}.FAM-codebox code{display:block;max-height:150px;max-width:none;padding:3px;margin:-3px;overflow:auto}blockquote.FAM-codebox{padding:3px}blockquote.FAM-codebox cite{margin:-3px -3px 0;max-width:none}blockquote.FAM-codebox>div{margin:0}.FAM-hidecode>dt:after{content:"Hidden:"}.FAM-codebox:before{content:""}.FAM-codebox>dt:before{font-family:FontAwesome;margin-right:3px}.FAM-spoiler dt:before{content:"\\f086"}.FAM-attachbox>dt:before,.FAM-codebox cite:before,.FAM-spoiler dt:before{font-family:FontAwesome;margin-right:3px}.FAM-codebox cite:before{content:"\\f10d"}.FAM-codebox>dt:before{content:"\\f121"}.FAM-spoiler>dt:before{content:"\\f071"}.FAM-hidecode>dt:before{content:"\\f070"}.FAM-attachbox>dt:before{content:"\\f0c6"}.FAM-spoiler_content{position:relative;display:inline-block}.FAM-spoiler_content:after{content:"";background:#000;position:absolute;top:0;left:0;right:0;bottom:0;visibility:visible}.FAM-spoiler_content:hover:after{visibility:hidden}.FAM-msg-text .FAM-post-content,.FAM-msg-text font[color]{color:inherit}#fc-token.FAM-inputbox{width:308px}.FAM-captcha p:first-child b,.FAM-captcha p:first-child strong{font-size:24px;display:inline-block;margin-bottom:6px}#FAM-tab-container{height:30px;position:relative;border-bottom:1px solid #ddd}#FAM-tab-add{font-size:18px;text-align:center;border-left:1px solid #ddd;position:absolute;right:0;top:0;width:30px;height:30px;cursor:pointer}#FAM-tab-add i,.FAM-tab{line-height:30px}#FAM-tab-add:hover{color:#39f}#FAM-tabs{width:80%;width:calc(100% - 30px);white-space:nowrap;overflow:hidden}#FAM-tabs:hover{overflow-x:auto;position:relative;z-index:1}.FAM-tab{background:#eee;border:1px solid #ddd;border-left:none;border-top:none;position:relative;display:inline-block;width:120px;height:30px;cursor:pointer}.FAM-tab:hover{background:#fff}.FAM-tab.FAM-tab-active{font-weight:700;background:#fff;cursor:default}.FAM-tab.FAM-tab-active:after{content:"";background:#39f;position:absolute;left:0;right:0;bottom:-1px;height:4px}.FAM-tab-name{font-size:12px;display:inline-block;padding:0 3px;width:80%;width:calc(100% - 16px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-tab-close{font-size:16px;position:absolute;top:50%;margin-top:-8px!important;right:3px;cursor:pointer}.FAM-tab-close:hover{color:#f33}#FAM #FAM-service-title a{color:#333;font-weight:400}#FAM-service-title b,#FAM-service-title i{color:#39c}#FAM-service-title b:last-child{color:#39f}#FAM-version-card{border:1px solid #ddd;border-radius:4px;text-align:left;width:80%;margin:30px auto 12px;white-space:nowrap;overflow-x:auto;position:relative}#FAM-version-status-icon{text-align:center;position:absolute;width:50px;left:0;top:50%;margin-top:-18px}#FAM-version-status-icon i{font-size:36px}#FAM-version-status-icon .fa-check-circle{color:#39f}#FAM-version-status-icon .fa-exclamation-circle{color:#f93}#FAM-version-info{width:100%;padding-left:50px}#FAM-version-info>div{margin:10px 0}#FAM-version-status{font-weight:700}#FAM-creator-info{text-align:center;margin-top:30px}#FAM-creator-info i{font-size:18px;vertical-align:middle}#FAM #FAM-search-keywords{font-size:18px;height:40px;padding:0 8px}#FAM-search-results{border:1px solid #ddd;max-height:300px;overflow:auto}#FAM-search-results .FAM-chat-avatar,.FAM-viewing-search .FAM-chat-avatar{display:none}#FAM-search-results .FAM-chat-icon,.FAM-viewing-search .FAM-chat-icon{left:10px;top:50%;margin-top:-17px}#FAM-modal-content,#FAM-modal-overlay{position:fixed;z-index:999999;top:0;left:0;right:0;bottom:0}#FAM-modal-overlay{background:rgba(0,0,0,.8)}#FAM-media-viewer,#FAM-modal-content,.FAM-modal-arrows{display:flex;justify-content:center;align-items:center;text-align:center}#FAM-media-viewer{background:#fff;border-radius:8px;position:relative;min-width:100px;min-height:100px;max-width:100%;max-width:calc(100% - 96px);max-height:100%;max-height:calc(100% - 96px);padding:16px}#FAM-media-list{width:100%;max-height:100vh;max-height:calc(100vh - 96px);overflow:hidden}#FAM-media-list>iframe,#FAM-media-list>img{max-width:100%;max-height:100vh;max-height:calc(100vh - 96px)}#FAM-media-list>a{font-size:24px;max-width:90%;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-modal-controls{color:#999;position:absolute;cursor:pointer;opacity:1}.FAM-modal-controls:hover{color:#fff}.FAM-modal-arrows{top:0;bottom:0;width:41px}#FAM-modal-prev{left:-25px;justify-content:flex-start}#FAM-modal-next{right:-25px;justify-content:flex-end}#FAM-modal-close{top:0;right:-25px;z-index:1}#FAM-view-media{top:30px;right:-26px;z-index:1}</style>');

        // add Forumactif Messenger to the document
        (embed ? embed : document.body).appendChild(frag);

        // apply cached settings
        FAM.page.settings.apply();

        // embedded initialization
        if (FAM.config.embed) {
          !FAM.history.restore() && FAM.tab.initial();

          // reset fullscreen setting when embedded
          if (window.JSON && window.localStorage && localStorage.fam_settings) {
            var settings = JSON.parse(localStorage.fam_settings);
            settings.fam_fullscreen = '';
            localStorage.fam_settings = JSON.stringify(settings);
          }
        }

        // close drop downs that are left open
        $(document).on('mousedown', function (e) {
          // drop down should be the first element in the arrays, other elements are those that should be excluded
          var close = [
            [FAM.cache.toolbar.querySelector('#FAM-menu'), FAM.cache.toolbar.querySelector('#FAM-menu-toggle')],
            [FAM.cache.actions.querySelector('#FAM-emoji-list'), FAM.cache.actions.querySelector('#FAM-emoji')],
            [FAM.cache.actions.querySelector('#FAM-attach-options'), FAM.cache.actions.querySelector('#FAM-attachment')]
          ], i = 0, j = close.length, a;

          for (; i < j; i++) {
            if (close[i][0] && close[i][0].style.visibility != 'hidden') {
              a = $(close[i]);

              if (!a.is(e.target) && !a.has(e.target)[0]) {
                close[i][0].style.visibility = 'hidden';
              }
            }
          }
        });

        delete FAM.init; // delete this function as to not initialize FAM again
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

    version : 'v0.8.0'
  };

  FAM.init(); // setup FAM
}());
