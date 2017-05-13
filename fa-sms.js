!window.FASMS && (function() {
  window.FASMS = {

    // general config
    config : {
      chat_category : '', // specify category e.g. '/c1-category' or leave empty '' for all index forums
      group_title : 'Select a Group', // initial title
      embed : '', // selector of element that you want to embed the chat app into. e.g. #wrap, #my-custom-element, etc..

      refresh : 5000,
      timeout : 10*60*1000,

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
          FASMS.get(FASMS.config.chat_category || '/forum', FASMS.config.group_title);
        }

      } else {
        FASMS.cache.chat.dataset.hidden = true;
      }
    },


    // get the specified page
    get : function (url, title, back) {
      var type = /c\d+-/.test(url) ? 'category' :
                 /f\d+-/.test(url) ? 'forum' :
                 /t\d+-/.test(url) ? 'topic' : 'category';

      // push new entry to history
      if (!back) {
        FASMS.history.push({
          url : url,
          title : title
        });

      } else {
        FASMS.history.pop();
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

      // get the page
      $.get(url, function (data) {
        var a = $(type == 'topic' ? '.post' : 'a.forumtitle, a.topictitle', data),
            form = type == 'topic' ? $('form[action="/post"]', data) : null,
            i = 0,
            j = a.length,
            html = '',
            row, avatar, date, name, msg, pages, type2;


        for (; i < j; i++) {
          if (type == 'topic') {
            avatar = $(FASMS.selector.post_avatar, a[i])[0];
            name = $(FASMS.selector.post_name, a[i])[0];
            name = name ? name.innerText : FASMS.config.no_name;
            date = $(FASMS.selector.post_date, a[i])[0];
            msg = $(FASMS.selector.post_message, a[i])[0];

            html +=
            '<div class="FASMS-msg' + ( name == _userdata.username ? ' FASMS-my-msg' : '' ) + '">'+
              '<span class="FASMS-msg-avatar">'+
                '<img src="' + ( avatar ? avatar.src : FASMS.config.no_avatar ) + '" alt="avatar">'+
              '</span>'+

              '<div class="FASMS-msg-box">'+
                '<span class="FASMS-msg-name">' + name + '</span>'+

                '<div class="FASMS-msg-content">' + FASMS.cleanMessage( msg ? msg.innerHTML : '' ) + '</div>'+

                '<span class="FASMS-msg-date">' + ( date ? date.innerText : '' ) + '</span>'+
              '</div>'+
            '</div>';

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
        '<input id="FASMS-msg" type="text" placeholder="' + FASMS.config.lang.msg_placeholder + '" onkeyup="FASMS.validate(this.value);">'+
        '<button id="FASMS-send" type="button" onclick="FASMS.send();" data-disabled="true"><i class="fa fa-paper-plane"></i></button>'+
        '<div style="display:none;">' + ( form ? form.innerHTML : '' ) + '</div>' : '';
      });
    },


    // log history so the user can go back
    history : [],

    back : function () {
      var history = FASMS.history[FASMS.history.length - 2];
      FASMS.get(history.url, history.title, true);
    },


    // validate a message to make sure that sending it is okay
    validate : function (message) {
      var send = FASMS.cache.actions.querySelector('#FASMS-send');

      if (message && send.dataset.disabled == 'true') {
        send.dataset.disabled = false;

      } else if (!message && send.dataset.disabled == 'false') {
        send.dataset.disabled = true;
      }
    },


    // send a message to the topic
    send : function () {

    },


    // clean message content and strip unnecessary data
    cleanMessage : function (string) {
      return string.replace(/<br>/g, '\n')
                   .replace(/^\n+|\n+$|^\s+|\s+$/g, '')
                   .replace(/\n/g, '<br>');
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
        FASMS.fVersion = $('.bodylinewidth')[0] ? 0 :
                      $('#phpbb #wrap')[0] ? 1 :
                      $('div.pun')[0] ? 2 :
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
            '.row3Right .postdetails', // phpbb2
            '.lastpost', // phpbb3
            '.tcr', // punbb
            '.lastaction', // invision
            '.forum-lastpost', // forumactif edge
            '.lastpost' // modernbb
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

          post_data : [
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
            '.entry-content > div > div', // punbb
            '.post-entry > div:not(.clear, .vote)', // invision
            '.content > div', // forumactif edge
            '.content > div' // modernbb
          ][FASMS.fVersion]
        };

        (FASMS.config.embed ? document.querySelector(FASMS.config.embed) : document.body).appendChild(frag);

        if (FASMS.config.embed) {
          FASMS.get(FASMS.config.chat_category || '/forum', FASMS.config.group_title);
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
  $('head').append('<style>@import url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css);#FASMS,#FASMS *{box-sizing:border-box}#FASMS,#FASMS-button{font-family:Arial;position:fixed;right:3px;z-index:99999}#FASMS{background:#fff;border:1px solid #ddd;min-height:400px;min-width:300px;visibility:visible;opacity:1;transition:500ms;color:#333;font-size:13px;height:70%;width:40%;bottom:35px}#FASMS[data-hidden=true]{visibility:hidden;opacity:0;bottom:-100%}#FASMS.FASMS-embeded{position:relative;bottom:0;right:0;width:100%;height:400px;margin:12px 0;z-index:1}#FASMS-button{color:#fff;font-size:18px;text-align:center;background:#39c;width:30px;height:30px;bottom:3px;cursor:pointer}#FASMS-button i{line-height:30px}#FASMS-button:hover{background-color:#28b}#FASMS-button:active{background-color:#17a}#FASMS-toolbar{color:#fff;background:#39c;border-bottom:1px solid #28b;height:40px;margin:-1px -1px 0}.FASMS-maintitle{color:#fff;font-size:18px;text-align:center;width:70%;margin:0 auto;overflow:hidden;text-overflow:ellipsis}a.FASMS-back{color:#fff;font-size:24px;position:absolute;height:40px;left:10px}#FASMS-toolbar,a.FASMS-back i{line-height:40px}a.FASMS-back:hover{color:#eee}a.FASMS-back:active{color:#ddd}#FASMS-content{height:90%;height:calc(100% - 80px);overflow-y:auto;overflow-x:hidden}.FASMS-loading{font-size:18px;font-weight:700;display:flex;justify-content:center;align-items:center;position:absolute;top:0;left:0;right:0;bottom:0}#FASMS-content::-webkit-scrollbar{width:8px;height:8px}#FASMS-content::-webkit-scrollbar-track{background:0 0}#FASMS-content::-webkit-scrollbar-thumb{background-color:#39c;border:none}#FASMS-content::-webkit-scrollbar-button:single-button{height:0;width:0}#FASMS-content::-webkit-scrollbar-thumb:hover,::-webkit-scrollbar-button:hover{background-color:#28b}#FASMS-content::-webkit-scrollbar-thumb:active,::-webkit-scrollbar-button:active{background-color:#069}#FASMS-actions{height:40px;border-top:1px solid #ddd}#FASMS-actions button{color:#333;font-size:18px;background:#fff;border:none;border-left:1px solid #ddd;height:40px;width:40px;cursor:pointer;outline:none}#FASMS-actions button:first-child{border:none}#FASMS-actions button:hover{background:#eee}#FASMS-actions button:active{background:#ddd}#FASMS-actions button[data-disabled=true]{pointer-events:none}#FASMS-actions button[data-disabled=true]>*{opacity:.5}#FASMS-msg{font-size:14px;border:none;border-left:1px solid #ddd;height:40px;width:calc(100% - 120px);margin:0;padding:0 6px;vertical-align:top;outline:none}a.FASMS-chat,a.FASMS-chat *{display:block}a.FASMS-chat{color:#333;border-bottom:2px solid #ddd;position:relative;padding:12px;height:80px}a.FASMS-chat:hover{background-color:#eee}.FASMS-chat-avatar{position:absolute;left:10px;top:50%;margin-top:-20px;height:40px;width:40px;overflow:hidden}.FASMS-chat-avatar img,.FASMS-msg-avatar img{height:100%;width:100%}.FASMS-chat-date,.FASMS-chat-title{position:absolute;left:0;width:100%;padding:0 12px 0 60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.FASMS-chat-title{font-size:14px;font-weight:700;top:20px}.FASMS-chat-date{bottom:20px}.FASMS-msg{position:relative;padding:12px;margin-bottom:12px}.FASMS-msg:after{content:"";display:table;clear:both}.FASMS-msg-avatar{height:40px;width:40px;display:block;margin-top:12px;overflow:hidden;float:left}.FASMS-my-msg .FASMS-msg-avatar{margin-top:-2px;float:right}.FASMS-msg-box{float:right;width:80%;width:calc(100% - 40px);padding-left:15px}.FASMS-my-msg .FASMS-msg-box{float:left;padding:0 15px 0 0}.FASMS-msg-content{color:#000;background:#ddd;border-radius:6px;padding:8px;margin:3px 0;min-height:30px;word-break:break-word;position:relative}.FASMS-msg-content:before{content:"";height:0;width:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:10px solid #ddd;position:absolute;top:10px;left:-10px}.FASMS-my-msg .FASMS-msg-content:before{border-right:none;border-left:10px solid #07c;top:12px;left:auto;right:-10px}.FASMS-msg-content a{color:inherit;text-decoration:underline}.FASMS-msg-content a:hover{text-decoration:none}.FASMS-msg-content *{max-width:100%}.FASMS-my-msg .FASMS-msg-content{color:#fff;background:#07c;text-align:right}.FASMS-my-msg .FASMS-msg-name{display:none}.FASMS-msg-date{text-align:right}.FASMS-msg-date,.FASMS-msg-name{font-size:12px;display:block;padding:0 3px;width:100%}</style>');
}());
