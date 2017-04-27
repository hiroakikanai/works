$(function () {
  $('.more-loading').hide();
  Loading.show();//ローダー表示

  var api = new API('');//api呼び出し

  //ログイン中ユーザーID
  var login_userid;

  //アドレスからパラメータを抽出
  function queryParams() {
    var pairs = location.search.substring(1).split('&');
    var result = {};
    for (var i in pairs) {
      var split = pairs[i].split('=');
        result[split[0]] = split[1];
      }
    return result;
  };
  var questionId = queryParams()['id'];//パラメータからId取得

  var userStats = api.getMyStats();
  function updateVote(item, target, voted, defaultClass) {
    var count = $(target).data('like_a');
    var parent = $(target).parent();
    if (voted) {
      count++;
      parent.removeClass('poine-icon').addClass('poine-icon-on');
    } else {
      count--;
      parent.removeClass('poine-icon-on').addClass('poine-icon');
    }

    $(target).data('voted', voted);
    $(target).data('like_a', count);
    if (count > 0) {
      $(target).text(count + '件');
    } else {
      $(target).html('&nbsp');
    }

    userStats.done(function(json) {
      if (json.by_role) {
        var certificateClass = (defaultClass.length > 0 ? defaultClass + '-' : '') + 'certificate';
        if (voted) {
          item.removeClass(defaultClass).addClass(certificateClass);
        } else {
          item.removeClass(certificateClass).addClass(defaultClass);
        }
      }
    });
  }

  //トップの質問を表示
  function showTree(){
    return api.getQuestionTree(questionId)
    .then(function(data){
      // 階層が違った場合に正しいページに飛ばす
      if (data.length != 1) {
        location.replace(location.href.replace('outou1.html', 'outou' + Math.min(data.length, 3) + '.html'));
        return;
      }

      var thumbnail_q = data[0]['posted_by_view']['thumbnail_url'];
      var name_q = data[0]['posted_by_view']['name'];
      var sentence_q = data[0]['sentence'];
      var now = new Date();
      var posted = Date.parse(data[0]['posted_at']);
      var duration_q = calcDuration(now-posted);
      var posted_userid0 = data[0]['posted_by_view']['id'];
      var mypage0;
      if(posted_userid0 === login_userid){mypage0 = 'mypage.html' + '?message_type=' + NarikiriAPI.MessageType.QUESTION}
      else{mypage0 = 'mypage.html?userid=' + posted_userid0 + '&message_type=' + NarikiriAPI.MessageType.QUESTION};
      var html = $(
      '<li class="clearfix">'+
      '<div class="left">'+
      '<a href="'+mypage0+'"><img src="'+thumbnail_q+'" alt="'+name_q+'" class="prf-thumb"></a>'+
      '</div>'+
      '<div class="right">'+
      '<div class="r-name">'+
      '<span class="prf-name"><a href="'+mypage0+'">'+name_q+'</a></span>'+
      '<span class="tstamp">'+duration_q+'</span>'+
      '</div>'+
      '<p class="honbun">'+sentence_q+'</p>'+
      '</div>'+
      '</li>');
      $('#talk ul').append(html);
    }, redirectToErrorPages);
  };

  //一覧表示数
  var limit = 20;
  //応答一覧を表示
  function showAnswer(questionId, page, orderBy){
    return api.getAnswers(questionId, limit, page, orderBy)
    .then(function(data){
      if ((data || []).length > 0) {
        $('.shitsumon-list .no-posts').parent().remove();
      }

      $.each(data,function(i){
        var thumbnail_a = data[i]['posted_by_view']['thumbnail_url'];
        var name_a = data[i]['posted_by_view']['name'];
        var sentence_a = data[i]['sentence'];
        var now = new Date();
        var posted = Date.parse(data[i].posted_at);
        var duration_a = calcDuration(now-posted);
        var reply_count_a = data[i]['reply_count'];
        var like_a = data[i]['vote_status']['number'];
        var like;
        if(like_a === 0){like = ""}else{like = like_a + '件'};//0件の時に表示させない
        var voted = data[i]['vote_status']['voted'];
        var g_poine_icon = data[i]['vote_status']['by_role'];
        var id = data[i]['id'];
        var outou2 = 'outou2.html?id=' + id;
        var posted_userid = data[i]['posted_by_view']['id'];
        var mypage;
        if(posted_userid === login_userid){mypage = 'mypage.html' + '?message_type=' + NarikiriAPI.MessageType.ANSWER}
        else{mypage = 'mypage.html?userid=' + posted_userid + '&message_type=' + NarikiriAPI.MessageType.ANSWER};
        var html = $('<li>'+
        '<div class="' + (g_poine_icon ? 'list-outou-certificate' : 'list-outou') + ' clearfix">'+
        '<div>'+
        '<a href="'+mypage+'"><img src="'+thumbnail_a+'" alt="'+name_a+'" class="prf-thumb"></a>'+
        '<div class="fuki-name">'+
        '<span class="prf-name"><a href="'+mypage+'">'+name_a+'</a></span>'+
        '<span class="tstamp">'+duration_a+'</span>'+
        '</div>'+
        '<p class="fuki-honbun"><a href="'+outou2+'">'+sentence_a+'</a></p>'+
        '</div>'+
        '<div class="fuki-small">'+
        '<span class="shitsumon-icon"><a href="'+outou2+'">質問する</a> ' + reply_count_a + '件</span>'+
        '<span class="' + (voted ? 'poine-icon-on' : 'poine-icon') + '"><a href="#" data-id="'+id+'" data-voted="'+voted+'" data-like_a="'+like_a+'">'+like+'&nbsp;</a></span>'+
        '</div>'+
        '</div>'+
        '</li>');
        $('.shitsumon-list li:last-child').before(html);

        //ぽいね！機能追加
        html.find('.poine-icon a,.poine-icon-on a').on('click', function (e) {
          e.preventDefault();
          var answerId = $(this).data('id');
          var voted = $(this).data('voted');
          var voting = $(this).data('voting');
          var target = $(this);
          var item = html.find('.list-outou,.list-outou-certificate');
          if (voting) {
            return;
          }
          if(!voted){
            $(this).data('voting', true);
            api.vote(answerId)
            .done(function() {
              target.removeData('voting');
              updateVote(item, target, true, 'list-outou');
            }).fail(redirectToErrorPages);
          }else{
            $(this).data('voting', true);
            api.cancelVote(answerId)
            .done(function() {
              target.removeData('voting');
              updateVote(item, target, false, 'list-outou');
            }).fail(redirectToErrorPages);
          }
          });
        });
      //「さらに読み込む」の表示・非表示
      if (data.has_next) {
        $('.more-loading').show();
      }else{
        $('.more-loading').hide();
      }
    }, redirectToErrorPages);
  };

  //さらに読むをクリック
  var page = 1;
  $('.more-loading').on('click', function (e) {
    e.preventDefault();
    Loading.show();
    showAnswer(questionId, page, limit).done(function() {
      Loading.hide();
    });
    page++;
  });

  //なりきり応答するをクリック
  $('.button-area .button').on('click', function(e) {
    e.preventDefault();
    var text = $('#outou-area').val();
    if (text.length < 1) {
      return;
    }
    api.postAnswer(text, questionId).done(function() {
      setPostCompleteAnimation();
      location.reload();
    }).fail(modalSendMessageError);
  });

  //ページ表示
  function showPage(){
    $.when(showTree(),showAnswer(questionId, 0)).done(function() {
      Loading.hide();
    });
  };

  function showUser(){
    //ログイン中ユーザー情報取得
    api.getMyStats()
    .then(function(data){
      login_userid = data['id'];})
      .then(function(){
        showPage(); //質問応答のリストを表示
      }, redirectToErrorPages);
    };
  showUser();
});
