!window.FASMS && (function() {
  window.FASMS = {

    // general config
    config : {
      chat_page : '', // specify a forum, category, or topic for chatting e.g. '/c1-category', '/f1-forum', '/t1-topic'. Leave blank for all forums.
      main_title : 'Select a Group', // initial title
      embed : '', // selector of element that you want to embed the chat app into. e.g. #wrap, #my-custom-element, etc..

      refresh : 5000,
      timeout : 10*60*1000,
      flood_control : 5000,

      ignore_announcements : false,
      ignore_firstpost : true,

      no_avatar : 'https://illiweb.com/fa/invision/pp-blank-thumb.png',
      no_name : 'Anon',

      lang : {
        loading : 'Loading...',
        msg_placeholder : 'enter message'
      }
    },


    // toggles the chat
    toggleChat : function () {
      if (FASMS.cache.chat.dataset.hidden == 'true') {
        FASMS.cache.chat.dataset.hidden = false;

        if (!FASMS.history.length) {
          FASMS.get(FASMS.config.chat_page || '/forum', FASMS.config.main_title);
        }

      } else {
        FASMS.cache.chat.dataset.hidden = true;
      }
    },


    // get the specified page
    get : function (url, title, noHistory) {
      var type = /c\d+-/.test(url) ? 'category' :
                 /f\d+-/.test(url) ? 'forum' :
                 /t\d+-/.test(url) ? 'topic' : 'category';

      // push new entry to history
      if (!noHistory) {
        FASMS.history.push({
          url : url,
          title : title
        });
      }

      // show / hide back button
      if (FASMS.history.length > 1 && FASMS.cache.back.style.display == 'none') {
        FASMS.cache.back.style.display = '';

      } else if (FASMS.history.length <= 1 && FASMS.cache.back.style.display != 'none') {
        FASMS.cache.back.style.display = 'none';
      }

      // update the main title
      FASMS.cache.title.querySelector('.FASMS-maintitle').innerText = title;

      // display loading texts
      FASMS.cache.content.innerHTML =
      '<div class="FASMS-loading">'+
        '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
        '<span class="sr-only">' + FASMS.config.lang.loading + '</span>'+
      '</div>';

      // reset the message log
      if (type == 'topic') {
        FASMS.msgLog = {};
      }

      // get the page
      $.get(url, function (data) {
        var a = $(type == 'topic' ? '.post[class*="post--"]' : 'a.forum' + ( FASMS.fVersion == 0 ? 'link' : 'title' ) + ', a.topictitle', data),
            form = type == 'topic' ? $('form[action="/post"]', data)[0] : null,
            i = 0,
            j = a.length,
            html = '',
            row, avatar, date, pages, type2;

        for (; i < j; i++) {
          // message structure
          if (type == 'topic') {
            html += FASMS.msgLog[a[i].className.replace(/.*?(post--\d+).*/, '$1')] = FASMS.parse(a[i]);

          // forum and category structure
          } else {
            row = $(a[i]).closest(FASMS.selector.row)[0];
            avatar = $('.lastpost-avatar img', row)[0];
            date = $(FASMS.selector.row_date, row)[0];
            type2 = /c\d+-/.test(a[i].href) ? 'category' :
                    /f\d+-/.test(a[i].href) ? 'forum' :
                    /t\d+-/.test(a[i].href) ? 'topic' : 'unknown';

            html +=
            '<a class="FASMS-chat FASMS-' + type2 + '" href="javascript:FASMS.get(\'' + a[i].href + ( type2 == 'topic' ? '?view=newest' : '' ) + '\', \'' + a[i].innerText + '\');">'+
              '<span class="FASMS-chat-avatar">'+
                '<img src="' + ( avatar ? avatar.src : FASMS.config.no_avatar ) + '" alt="avatar">'+
              '</span>'+

              '<span class="FASMS-chat-title">' + a[i].innerText + '</span>'+

              '<span class="FASMS-chat-date">' + ( date ? date.innerText : '' ) + '</span>'+
            '</a>';
          }
        }

        FASMS.cache.content.innerHTML = html;
        FASMS.cache.actions.innerHTML = type == 'topic' ?
        '<button id="FASMS-attachment" type="button"><i class="fa fa-paperclip"></i></button>'+
        '<button id="FASMS-emoji" type="button"><i class="fa fa-smile-o"></i></button>'+
        '<input id="FASMS-msg" type="text" placeholder="' + FASMS.config.lang.msg_placeholder + '" onkeyup="FASMS.validate(this.value, event);">'+
        '<button id="FASMS-send" type="button" onclick="FASMS.send();" data-disabled="true"><i class="fa fa-paper-plane"></i></button>'+
        ( form ? form.outerHTML.replace(/id=".*?"|name=".*?"/, '').replace('<form', '<form name="postsms" style="display:none"') : '' ) : '';

        // topic specific initializations
        if (type == 'topic') {
          FASMS.scroll();

          // listen for new posts and changes to existing messages
          FASMS.listen = setInterval(function () {
            if (!FASMS.sending) {
              FASMS.checkMessages();
            }
          }, FASMS.config.refresh);
        }
      });
    },


    // log history so the user can go back
    history : [],
    back : function () {
      var history = FASMS.history[FASMS.history.length - 2];
      FASMS.history.pop();
      FASMS.get(history.url, history.title, true);

      // stop listening for message changes
      if (FASMS.listen) {
        clearInterval(FASMS.listen);
        delete FASMS.listen;
      }
    },


    // validate a message to make sure that sending it is okay
    validate : function (message, e) {
      var send = FASMS.cache.actions.querySelector('#FASMS-send');

      if (message && send.dataset.disabled == 'true') {
        send.dataset.disabled = false;

      } else if (!message && send.dataset.disabled == 'false') {
        send.dataset.disabled = true;
      }

      if (e && FASMS.cache.actions.querySelector('#FASMS-send').dataset.disabled != 'true' && {
        'Enter' : 1,
        '13' : 1
      }[e.key || e.keyCode]) {
        FASMS.send();
      }
    },


    // send a message to the topic
    send : function () {
      if (FASMS.sending) {
        return false;
      } else {
        FASMS.sending = true;
      }

      var msg = document.getElementById('FASMS-msg'),
          val = msg.value;

      msg.value = '';
      FASMS.validate();

      // show placeholder message until the sent message is ready
      FASMS.cache.content.insertAdjacentHTML('beforeend',
        '<div class="FASMS-msg FASMS-my-msg FASMS-msg-placeholder">'+
          '<span class="FASMS-msg-avatar">' + _userdata.avatar + '</span>'+
          '<div class="FASMS-msg-box">'+
            '<div class="FASMS-msg-content"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></div>'+
            '<div class="FASMS-msg-date"></div>'+
          '</div>'+
        '</div>'
      );
      FASMS.scroll();

      // post the message to the topic
      $.post('/post', $(document.postsms).serialize().replace(
        'message=',
        'message=' + (
          /UTF-8/i.test(document.characterSet) ?
            encodeURIComponent(val) :
            // URI encoding for NON-UTF8 forums
            encodeURIComponent(escape(val).replace(/%u[A-F0-9]{4}/g, function(match) {
              return '&#' + parseInt(match.substr(2), 16) + ';'
            })).replace(/%25/g, '%')
        )
      ) + '&post=1', function (data) {
        // get the new message and remove the placeholder + sending restriction
        FASMS.checkMessages(function () {
          FASMS.cache.content.removeChild(FASMS.cache.content.querySelector('.FASMS-msg-placeholder'));
          FASMS.scroll();

          // wait the specified time before sending another message
          window.setTimeout(function () {
            FASMS.sending = false;
          }, FASMS.config.flood_control);
        });
      });
    },


    // check for new messages / edits and update the message list
    checkMessages : function (callback) {
      $.get(FASMS.history[FASMS.history.length - 1].url, function (data) {
        for (var a = $('.post[class*="post--"]', data), i = 0, j = a.length, pid, msg; i < j; i++) {
          pid = a[i].className.replace(/.*?(post--\d+).*/, '$1');
          msg = FASMS.parse(a[i]);

          // check for edited messages and update them
          if (FASMS.msgLog[pid]) {
            if (FASMS.msgLog[pid] != msg) {
              FASMS.msgLog[pid] = msg;
              FASMS.cache.content.querySelector('.FASMS-msg.' + pid).outerHTML = msg;
            }

          // add in new messages if there are any
          } else {
            FASMS.msgLog[pid] = msg;
            FASMS.cache.content.insertAdjacentHTML('beforeend', msg);
            FASMS.scroll();
          }
        }

        // optional callback to execute, mainly used for send()
        if (typeof callback === 'function') {
          callback();
        }
      });
    },


    // returns the parsed message
    parse : function (post) {
      var avatar, name, pLink, group, date, msg;

      avatar = $(FASMS.selector.post_avatar, post)[0];

      // get username
      name = $(FASMS.selector.post_name, post)[0];

      // check if the user link is available
      pLink = name.getElementsByTagName('A')[0];
      pLink = pLink ? '<a href="' + pLink.href + '">' : null;

      // check if the user is in a group
      group = name.getElementsByTagName('SPAN')[0];
      group = group ? '<span style="' + group.getAttribute('style') + '"><strong>' : null;

      // check if the username is available
      name = name ? name.innerText : FASMS.config.no_name;

      date = $(FASMS.selector.post_date, post)[0];
      msg = $(FASMS.selector.post_message, post)[0];

      return '<div class="FASMS-msg' + ( name == _userdata.username ? ' FASMS-my-msg' : '' ) + ' ' + post.className.replace(/.*?(post--\d+).*/, '$1') + '">'+
        '<span class="FASMS-msg-avatar">'+
          (pLink ? pLink : '')+
          '<img src="' + ( avatar ? avatar.src : FASMS.config.no_avatar ) + '" alt="avatar">'+
          (pLink ? '</a>' : '')+
        '</span>'+

        '<div class="FASMS-msg-box">'+
          '<div class="FASMS-msg-name">'+
            (pLink ? pLink : '')+
              (group ? group : '')+
                name+
              (group ? '</strong></span>' : '')+
            (pLink ? '</a>' : '')+
          '</div>'+
          '<div class="FASMS-msg-content">' + ( msg ? msg.innerHTML.replace(/<br>/g, '\n').replace(/^\n+|\n+$|^\s+|\s+$/g, '').replace(/\n/g, '<br>') : '' ) + '</div>'+
          '<div class="FASMS-msg-date">' + ( date ? date.innerText : '' ) + '</div>'+
        '</div>'+
      '</div>';
    },


    // scroll to the newest message or specified amount
    scroll : function (amount) {
      FASMS.cache.content.scrollTop = amount || FASMS.cache.content.scrollHeight;
    },


    // initial setup of FASMS
    init : function () {
      var initialized = false;

      // builds the necessary chat elements
      function build () {
        var button = document.createElement('A'),
            chat = document.createElement('DIV'),
            frag = document.createDocumentFragment();

        chat.id = 'FASMS';
        chat.className = FASMS.config.embed ? 'FASMS-embeded' : '';
        chat.dataset.hidden = FASMS.config.embed ? false : true;
        chat.innerHTML =
        '<div id="FASMS-toolbar">'+
          '<a class="FASMS-back" href="javascript:FASMS.back();" style="display:none"><i class="fa fa-arrow-left"></i></a>'+
          '<h1 class="FASMS-maintitle"></h1>'+
       '</div>'+
       '<div id="FASMS-content"></div>'+
       '<div id="FASMS-actions"></div>';
       frag.appendChild(chat);

        if (!FASMS.config.embed) {
          button.id = 'FASMS-button';
          button.innerHTML = '<i class="fa fa-comment"></i>';
          button.onclick = FASMS.toggleChat;
          frag.appendChild(button);
        }

        // cache nodes
        FASMS.cache = {
          button : button,
          chat : chat,
          back : chat.querySelector('.FASMS-back'),
          title : chat.querySelector('#FASMS-toolbar'),
          content : chat.querySelector('#FASMS-content'),
          actions : chat.querySelector('#FASMS-actions')
        };


        // set forum version
        FASMS.fVersion = document.querySelector('.bodylinewidth') ? 0 :
                      document.getElementById('phpbb') ? 1 :
                      document.querySelector('div.pun') ? 2 :
                      document.getElementById('ipbwrapper') ? 3 :
                      document.getElementById('fa_edge') ? 4 :
                      document.getElementById('modernbb') ? 5 :
                      'badapple';

        // css selectors by version
        FASMS.selector = {
          row : [
            'tr', // phpbb2
            '.row', // phpbb3
            'tr', // punbb
            'tr', // invision
            '.forum-block', // forumactif edge
            '.row' // modernbb
          ][FASMS.fVersion],

          row_date : [
            '.row3Right .postdetails, .row3.over .gensmall', // phpbb2
            '.lastpost span:not(.lastpost-avatar)', // phpbb3
            '.tcr', // punbb
            '.lastaction, td:last-child > span:last-child', // invision
            '.forum-lastpost', // forumactif edge
            '.lastpost > span:not(.lastpost-avatar)' // modernbb
          ][FASMS.fVersion],

          post_avatar : [
            '.postdetails.poster-profile img', // phpbb2
            '.postprofile dt img', // phpbb3
            '.user-basic-info img', // punbb
            '.postprofile dt img', // invision
            '.user-avatar img', // forumactif edge
            '.postprofile-avatar img' // modernbb
          ][FASMS.fVersion],

          post_name : [
            '.name', // phpbb2
            '.postprofile dt strong', // phpbb3
            '.username', // punbb
            '.postprofile dt strong', // invision
            '.username', // forumactif edge
            '.postprofile-name' // modernbb
          ][FASMS.fVersion],

          post_date : [
            '.postdetails:not(.poster-profile)', // phpbb2
            '.author', // phpbb3
            '.posthead h2', // punbb
            '.author', // invision
            '.author', // forumactif edge
            '.topic-date' // modernbb
          ][FASMS.fVersion],

          post_message : [
            '.postbody > div', // phpbb2
            '.content > div', // phpbb3
            '.entry-content > div:not(.vote) > div', // punbb
            '.post-entry > div:not(.clear, .vote)', // invision
            '.content > div', // forumactif edge
            '.content > div' // modernbb
          ][FASMS.fVersion]
        };

        (FASMS.config.embed ? document.querySelector(FASMS.config.embed) : document.body).appendChild(frag);

        if (FASMS.config.embed) {
          FASMS.get(FASMS.config.chat_page || '/forum', FASMS.config.main_title);
        }

        delete FASMS.init;
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
          document.onreadystatechange = ready;
        }

      } catch (error) {
        $(build); // jQuery fallback
      }

    }
  };

  // setup FASMS
  FASMS.init();


  // FASMS styles
  $('head').append('<style>@import url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css);#modernbb #FASMS i.fa,#modernbb #FASMS-button i.fa,#modernbb #FASMS-send{margin:initial;vertical-align:initial}#FASMS,#FASMS *{box-sizing:border-box}#FASMS,#FASMS-button{font-family:Arial;position:fixed;right:3px;z-index:99999}#FASMS{background:#fff;border:1px solid #ddd;min-height:400px;min-width:300px;visibility:visible;opacity:1;transition:500ms;color:#333;font-size:13px;height:70%;width:40%;bottom:35px}#FASMS[data-hidden=true]{visibility:hidden;opacity:0;bottom:-100%}#FASMS.FASMS-embeded{position:relative;bottom:0;right:0;width:100%;height:400px;margin:12px 0;z-index:1}#FASMS-button{color:#fff;font-size:18px;text-align:center;background:#39c;width:30px;height:30px;bottom:3px;cursor:pointer}#FASMS-button i{line-height:30px}#FASMS-button:hover{background-color:#28b}#FASMS-button:active{background-color:#17a}#FASMS-toolbar{color:#fff;background:#39c;border-bottom:1px solid #28b;height:40px;margin:-1px -1px 0}.FASMS-maintitle{color:#fff;font-size:18px;text-align:center;width:70%;margin:0 auto;overflow:hidden;text-overflow:ellipsis}a.FASMS-back{color:#fff;font-size:24px;position:absolute;height:40px;left:10px}#FASMS-toolbar,a.FASMS-back i{line-height:40px}a.FASMS-back:hover{color:#eee}a.FASMS-back:active{color:#ddd}#FASMS-content{height:90%;height:calc(100% - 80px);overflow-y:auto;overflow-x:hidden}.FASMS-loading{font-size:18px;font-weight:700;display:flex;justify-content:center;align-items:center;position:absolute;top:0;left:0;right:0;bottom:0}#FASMS-content::-webkit-scrollbar{width:8px;height:8px}#FASMS-content::-webkit-scrollbar-track{background:0 0}#FASMS-content::-webkit-scrollbar-thumb{background-color:#39c;border:none}#FASMS-content::-webkit-scrollbar-button:single-button{height:0;width:0}#FASMS-content::-webkit-scrollbar-thumb:hover,::-webkit-scrollbar-button:hover{background-color:#28b}#FASMS-content::-webkit-scrollbar-thumb:active,::-webkit-scrollbar-button:active{background-color:#069}#FASMS-actions{height:40px;border-top:1px solid #ddd}#FASMS-actions button{color:#333;font-size:18px;background:#fff;border:none;border-left:1px solid #ddd;height:40px;width:40px;cursor:pointer;outline:none}#FASMS-actions button:first-child{border:none}#FASMS-actions button:hover{background:#eee}#FASMS-actions button:active{background:#ddd}#FASMS-actions button[data-disabled=true]{pointer-events:none}#FASMS-actions button[data-disabled=true]>*{opacity:.5}#FASMS-msg{font-size:14px;border:none;border-left:1px solid #ddd;height:40px;width:calc(100% - 120px);margin:0;padding:0 6px;vertical-align:top;outline:none}a.FASMS-chat,a.FASMS-chat *{display:block}a.FASMS-chat{color:#333;border-bottom:2px solid #ddd;position:relative;padding:12px;height:80px}a.FASMS-chat:hover{background-color:#eee}.FASMS-chat-avatar{position:absolute;left:10px;top:50%;margin-top:-20px;height:40px;width:40px;overflow:hidden}.FASMS-chat-avatar img,.FASMS-msg-avatar img{height:100%;width:100%}.FASMS-chat-date,.FASMS-chat-title{position:absolute;left:0;width:100%;padding:0 12px 0 60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FASMS-chat-title{font-size:14px;font-weight:700;top:20px}.FASMS-chat-date{bottom:20px}.FASMS-msg{position:relative;padding:12px;margin-bottom:12px}.FASMS-msg:after{content:"";display:table;clear:both}.FASMS-msg-avatar{height:40px;width:40px;display:block;margin-top:12px;overflow:hidden;float:left}.FASMS-my-msg .FASMS-msg-avatar{margin-top:-2px;float:right}.FASMS-msg-box{float:right;width:80%;width:calc(100% - 40px);padding-left:15px}.FASMS-my-msg .FASMS-msg-box{float:left;padding:0 15px 0 0}.FASMS-msg-content{color:#000;background:#ddd;border-radius:6px;padding:8px;margin:3px 0;min-height:30px;max-width:80%;position:relative}.FASMS-msg-content:before{content:"";height:0;width:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:10px solid #ddd;position:absolute;top:10px;left:-10px}.FASMS-my-msg .FASMS-msg-content{color:#fff;background:#07c;float:right}.FASMS-my-msg .FASMS-msg-content:before{border-right:none;border-left:10px solid #07c;top:12px;left:auto;right:-10px}.FASMS-msg-content a{color:inherit;text-decoration:underline}.FASMS-msg-content a:hover{text-decoration:none}.FASMS-msg-content *{max-width:100%}.FASMS-msg-date{clear:both}.FASMS-msg-date,.FASMS-msg-name{font-size:12px;padding:0 3px;width:100%}.FASMS-my-msg .FASMS-msg-name{display:none}.FASMS-my-msg .FASMS-msg-date{text-align:right}</style>');
}());
