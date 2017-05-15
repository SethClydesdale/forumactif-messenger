!window.FAM && (function() {
  window.FAM = {

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
      if (FAM.cache.chat.dataset.hidden == 'true') {
        FAM.cache.chat.dataset.hidden = false;

        if (!FAM.history.length) {
          FAM.get(FAM.config.chat_page || '/forum', FAM.config.main_title);
        }

      } else {
        FAM.cache.chat.dataset.hidden = true;
      }
    },


    // get the specified page
    get : function (url, title, noHistory) {
      var type = /c\d+-/.test(url) ? 'category' :
                 /f\d+-/.test(url) ? 'forum' :
                 /t\d+-/.test(url) ? 'topic' : 'category';

      // push new entry to history
      if (!noHistory) {
        FAM.history.push({
          url : url,
          title : title
        });
      }

      // show / hide back button
      if (FAM.history.length > 1 && FAM.cache.back.style.display == 'none') {
        FAM.cache.back.style.display = '';

      } else if (FAM.history.length <= 1 && FAM.cache.back.style.display != 'none') {
        FAM.cache.back.style.display = 'none';
      }

      // update the main title
      FAM.cache.title.querySelector('.FAM-maintitle').innerText = title;

      // display loading texts
      FAM.cache.content.innerHTML =
      '<div class="FAM-loading">'+
        '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>'+
        '<span class="sr-only">' + FAM.config.lang.loading + '</span>'+
      '</div>';

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
            row, avatar, date, pages, type2;

        for (; i < j; i++) {
          // message structure
          if (type == 'topic') {
            html += FAM.msgLog[a[i].className.replace(/.*?(post--\d+).*/, '$1')] = FAM.parse(a[i]);

          // forum and category structure
          } else {
            row = $(a[i]).closest(FAM.selector.row)[0];
            avatar = $('.lastpost-avatar img', row)[0];
            date = $(FAM.selector.row_date, row)[0];
            type2 = /c\d+-/.test(a[i].href) ? 'category' :
                    /f\d+-/.test(a[i].href) ? 'forum' :
                    /t\d+-/.test(a[i].href) ? 'topic' : 'unknown';

            html +=
            '<a class="FAM-chat FAM-' + type2 + '" href="javascript:FAM.get(\'' + a[i].href + ( type2 == 'topic' ? '?view=newest' : '' ) + '\', \'' + a[i].innerText + '\');">'+
              '<span class="FAM-chat-avatar">'+
                '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
              '</span>'+

              '<span class="FAM-chat-title">' + a[i].innerText + '</span>'+

              '<span class="FAM-chat-date">' + ( date ? date.innerText : '' ) + '</span>'+
            '</a>';
          }
        }

        FAM.cache.content.innerHTML = html;
        FAM.cache.actions.innerHTML = type == 'topic' ?
        '<button id="FAM-attachment" type="button"><i class="fa fa-paperclip"></i></button>'+
        '<button id="FAM-emoji" type="button"><i class="fa fa-smile-o"></i></button>'+
        '<input id="FAM-msg" type="text" placeholder="' + FAM.config.lang.msg_placeholder + '" onkeyup="FAM.validate(this.value, event);">'+
        '<button id="FAM-send" type="button" onclick="FAM.send();" data-disabled="true"><i class="fa fa-paper-plane"></i></button>'+
        ( form ? form.outerHTML.replace(/id=".*?"|name=".*?"/, '').replace('<form', '<form name="postmsg" style="display:none"') : '' ) : '';

        // topic specific initializations
        if (type == 'topic') {
          FAM.scroll();

          // listen for new posts and changes to existing messages
          FAM.listen = setInterval(function () {
            if (!FAM.sending) {
              FAM.checkMessages();
            }
          }, FAM.config.refresh);
        }
      });
    },


    // log history so the user can go back
    history : [],
    back : function () {
      var history = FAM.history[FAM.history.length - 2];
      FAM.history.pop();
      FAM.get(history.url, history.title, true);

      // stop listening for message changes
      if (FAM.listen) {
        clearInterval(FAM.listen);
        delete FAM.listen;
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

      if (e && FAM.cache.actions.querySelector('#FAM-send').dataset.disabled != 'true' && {
        'Enter' : 1,
        '13' : 1
      }[e.key || e.keyCode]) {
        FAM.send();
      }
    },


    // send a message to the topic
    send : function () {
      if (FAM.sending) {
        return false;
      } else {
        FAM.sending = true;
      }

      var msg = document.getElementById('FAM-msg'),
          val = msg.value;

      msg.value = '';
      FAM.validate();

      // show placeholder message until the sent message is ready
      FAM.cache.content.insertAdjacentHTML('beforeend',
        '<div class="FAM-msg FAM-my-msg FAM-msg-placeholder">'+
          '<span class="FAM-msg-avatar">' + _userdata.avatar + '</span>'+
          '<div class="FAM-msg-box">'+
            '<div class="FAM-msg-content"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></div>'+
            '<div class="FAM-msg-date"></div>'+
          '</div>'+
        '</div>'
      );
      FAM.scroll();

      // post the message to the topic
      $.post('/post', $(document.postmsg).serialize().replace(
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
        FAM.checkMessages(function () {
          FAM.cache.content.removeChild(FAM.cache.content.querySelector('.FAM-msg-placeholder'));
          FAM.scroll();

          // wait the specified time before sending another message
          window.setTimeout(function () {
            FAM.sending = false;
          }, FAM.config.flood_control);
        });
      });
    },


    // check for new messages / edits and update the message list
    checkMessages : function (callback) {
      $.get(FAM.history[FAM.history.length - 1].url, function (data) {
        for (var a = $('.post[class*="post--"]', data), i = 0, j = a.length, pid, msg; i < j; i++) {
          pid = a[i].className.replace(/.*?(post--\d+).*/, '$1');
          msg = FAM.parse(a[i]);

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
            FAM.scroll();
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

      avatar = $(FAM.selector.post_avatar, post)[0];

      // get username
      name = $(FAM.selector.post_name, post)[0];

      // check if the user link is available
      pLink = name.getElementsByTagName('A')[0];
      pLink = pLink ? '<a href="' + pLink.href + '">' : null;

      // check if the user is in a group
      group = name.getElementsByTagName('SPAN')[0];
      group = group ? '<span style="' + group.getAttribute('style') + '"><strong>' : null;

      // check if the username is available
      name = name ? name.innerText : FAM.config.no_name;

      date = $(FAM.selector.post_date, post)[0];
      msg = $(FAM.selector.post_message, post)[0];

      return '<div class="FAM-msg' + ( name == _userdata.username ? ' FAM-my-msg' : '' ) + ' ' + post.className.replace(/.*?(post--\d+).*/, '$1') + '">'+
        '<span class="FAM-msg-avatar">'+
          (pLink ? pLink : '')+
          '<img src="' + ( avatar ? avatar.src : FAM.config.no_avatar ) + '" alt="avatar">'+
          (pLink ? '</a>' : '')+
        '</span>'+

        '<div class="FAM-msg-box">'+
          '<div class="FAM-msg-name">'+
            (pLink ? pLink : '')+
              (group ? group : '')+
                name+
              (group ? '</strong></span>' : '')+
            (pLink ? '</a>' : '')+
          '</div>'+
          '<div class="FAM-msg-content">' + ( msg ? msg.innerHTML.replace(/<br>/g, '\n').replace(/^\n+|\n+$|^\s+|\s+$/g, '').replace(/\n/g, '<br>') : '' ) + '</div>'+
          '<div class="FAM-msg-date">' + ( date ? date.innerText : '' ) + '</div>'+
        '</div>'+
      '</div>';
    },


    // scroll to the newest message or specified amount
    scroll : function (amount) {
      FAM.cache.content.scrollTop = amount || FAM.cache.content.scrollHeight;
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
          '<a class="FAM-back" href="javascript:FAM.back();" style="display:none"><i class="fa fa-arrow-left"></i></a>'+
          '<h1 class="FAM-maintitle"></h1>'+
       '</div>'+
       '<div id="FAM-content"></div>'+
       '<div id="FAM-actions"></div>';
       frag.appendChild(chat);

        if (!FAM.config.embed) {
          button.id = 'FAM-button';
          button.innerHTML = '<i class="fa fa-comment"></i>';
          button.onclick = FAM.toggleChat;
          frag.appendChild(button);
        }

        // cache nodes
        FAM.cache = {
          button : button,
          chat : chat,
          back : chat.querySelector('.FAM-back'),
          title : chat.querySelector('#FAM-toolbar'),
          content : chat.querySelector('#FAM-content'),
          actions : chat.querySelector('#FAM-actions')
        };


        // set forum version
        FAM.fVersion = document.querySelector('.bodylinewidth') ? 0 :
                      document.getElementById('phpbb') ? 1 :
                      document.querySelector('div.pun') ? 2 :
                      document.getElementById('ipbwrapper') ? 3 :
                      document.getElementById('fa_edge') ? 4 :
                      document.getElementById('modernbb') ? 5 :
                      'badapple';

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
          FAM.get(FAM.config.chat_page || '/forum', FAM.config.main_title);
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
          document.onreadystatechange = ready;
        }

      } catch (error) {
        $(build); // jQuery fallback
      }

    }
  };

  // setup FAM
  FAM.init();


  // FAM styles
  $('head').append('<style>@import url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css);#modernbb #FAM i.fa,#modernbb #FAM-button i.fa,#modernbb #FAM-send{margin:initial;vertical-align:initial}#FAM,#FAM *{box-sizing:border-box}#FAM,#FAM-button{font-family:Arial;position:fixed;right:3px;z-index:99999}#FAM{background:#fff;border:1px solid #ddd;min-height:400px;min-width:300px;visibility:visible;opacity:1;transition:500ms;color:#333;font-size:13px;height:70%;width:40%;bottom:35px}#FAM[data-hidden=true]{visibility:hidden;opacity:0;bottom:-100%}#FAM.FAM-embeded{position:relative;bottom:0;right:0;width:100%;height:400px;margin:12px 0;z-index:1}#FAM-button{color:#fff;font-size:18px;text-align:center;background:#39c;width:30px;height:30px;bottom:3px;cursor:pointer}#FAM-button i{line-height:30px}#FAM-button:hover{background-color:#28b}#FAM-button:active{background-color:#17a}#FAM-toolbar{color:#fff;background:#39c;border-bottom:1px solid #28b;height:40px;margin:-1px -1px 0}.FAM-maintitle{color:#fff;font-size:18px;text-align:center;width:70%;margin:0 auto;overflow:hidden;text-overflow:ellipsis}a.FAM-back{color:#fff;font-size:24px;position:absolute;height:40px;left:10px}#FAM-toolbar,a.FAM-back i{line-height:40px}a.FAM-back:hover{color:#eee}a.FAM-back:active{color:#ddd}#FAM-content{height:90%;height:calc(100% - 80px);overflow-y:auto;overflow-x:hidden}.FAM-loading{font-size:18px;font-weight:700;display:flex;justify-content:center;align-items:center;position:absolute;top:0;left:0;right:0;bottom:0}#FAM-content::-webkit-scrollbar{width:8px;height:8px}#FAM-content::-webkit-scrollbar-track{background:0 0}#FAM-content::-webkit-scrollbar-thumb{background-color:#39c;border:none}#FAM-content::-webkit-scrollbar-button:single-button{height:0;width:0}#FAM-content::-webkit-scrollbar-thumb:hover,::-webkit-scrollbar-button:hover{background-color:#28b}#FAM-content::-webkit-scrollbar-thumb:active,::-webkit-scrollbar-button:active{background-color:#069}#FAM-actions{height:40px;border-top:1px solid #ddd}#FAM-actions button{color:#333;font-size:18px;background:#fff;border:none;border-left:1px solid #ddd;height:40px;width:40px;cursor:pointer;outline:none}#FAM-actions button:first-child{border:none}#FAM-actions button:hover{background:#eee}#FAM-actions button:active{background:#ddd}#FAM-actions button[data-disabled=true]{pointer-events:none}#FAM-actions button[data-disabled=true]>*{opacity:.5}#FAM-msg{font-size:14px;border:none;border-left:1px solid #ddd;height:40px;width:calc(100% - 120px);margin:0;padding:0 6px;vertical-align:top;outline:none}a.FAM-chat,a.FAM-chat *{display:block}a.FAM-chat{color:#333;border-bottom:2px solid #ddd;position:relative;padding:12px;height:80px}a.FAM-chat:hover{background-color:#eee}.FAM-chat-avatar{position:absolute;left:10px;top:50%;margin-top:-20px;height:40px;width:40px;overflow:hidden}.FAM-chat-avatar img,.FAM-msg-avatar img{height:100%;width:100%}.FAM-chat-date,.FAM-chat-title{position:absolute;left:0;width:100%;padding:0 12px 0 60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FAM-chat-title{font-size:14px;font-weight:700;top:20px}.FAM-chat-date{bottom:20px}.FAM-msg{position:relative;padding:12px;margin-bottom:12px}.FAM-msg:after{content:"";display:table;clear:both}.FAM-msg-avatar{height:40px;width:40px;display:block;margin-top:12px;overflow:hidden;float:left}.FAM-my-msg .FAM-msg-avatar{margin-top:-2px;float:right}.FAM-msg-box{float:right;width:80%;width:calc(100% - 40px);padding-left:15px}.FAM-my-msg .FAM-msg-box{float:left;padding:0 15px 0 0}.FAM-msg-content{color:#000;background:#ddd;border-radius:6px;padding:8px;margin:3px 0;min-height:30px;max-width:80%;position:relative;float:left}.FAM-msg-content:before{content:"";height:0;width:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:10px solid #ddd;position:absolute;top:10px;left:-10px}.FAM-my-msg .FAM-msg-content{color:#fff;background:#07c;float:right}.FAM-my-msg .FAM-msg-content:before{border-right:none;border-left:10px solid #07c;top:12px;left:auto;right:-10px}.FAM-msg-content a{color:inherit;text-decoration:underline}.FAM-msg-content a:hover{text-decoration:none}.FAM-msg-content *{max-width:100%}.FAM-msg-date{clear:both}.FAM-msg-date,.FAM-msg-name{font-size:12px;padding:0 3px;width:100%}.FAM-my-msg .FAM-msg-name{display:none}.FAM-my-msg .FAM-msg-date{text-align:right}</style>');
}());
