$(function () {
    $('.more-loading').hide();
    Loading.show();//ローダー表示

    var api = new NarikiriAPI('maxmurai');
    var limit = 20;
    var login_userid;

    // クエリパラメーター取得
    function queryParams() {
      var pairs = location.search.substring(1).split('&');
      var result = {};
      for (var i in pairs) {
        var split = pairs[i].split('=');
        result[split[0]] = split[1];
      }
      return result;
    }

    //質問欄のユーザーサムネを表示
    function showUser(){
      api.getMyStats()
      .then(function(data){
        var thumbnail = data['thumbnail_url'];
        var name = data['name'];
        login_userid = data['id'];
        $('.button-area img').attr('src',thumbnail).attr('alt',name);
      }, redirectToErrorPages)
      .then(function(){
        showPage(); //質問応答のリストを表示
      });
    };
    showUser();

    function showPage(){
      $.when(showList(0, orderBy), showPairCount()).done(function() {
        Loading.hide();
      }).fail(redirectToErrorPages);
    }

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

    function showPairCount() {
      return api.getStats()
        .then(function(data) {
          $('.count-num').text(data.pairs_count.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,'));
        });
    }

    var orderBy = queryParams()['order_by'];
    $('#sort').val(orderBy);
    //質問一覧を表示
    function showList(page, orderBy){
      return api.getTopContents(limit, page, orderBy)
      .then(function(data){
          if ((data || []).length > 0) {
            $('.shitsumon-list .no-posts').parent().remove();
          }

          $.each(data,function(i){
            var now = new Date();
            //質問
            var thumbnail_q = data[i]['question']['posted_by_view']['thumbnail_url'];
            var name_q = data[i]['question']['posted_by_view']['name'];
            var posted_userid = data[i]['question']['posted_by_view']['id'];
            if(login_userid === posted_userid){
              var mypage_id = ''
            }else{
              var mypage_id = 'userid=' + posted_userid + '&';
            }
            var mypage = 'mypage.html?' + mypage_id + 'message_type=' + NarikiriAPI.MessageType.QUESTION;
            var sentence_q = data[i]['question']['sentence'];
            var reply_count = data[i]['question']['reply_count'];
            var id_q = data[i]['question']['id'];
            var outou1 = 'outou1.html?id=' + id_q;
            var posted_q = Date.parse(data[i]['question'].posted_at);
            var duration_q = calcDuration(now-posted_q);
            //応答
            if(data[i]['answer']){
            var thumbnail_a = data[i]['answer']['posted_by_view']['thumbnail_url'];
            var name_a = data[i]['answer']['posted_by_view']['name'];
            var posted_userid = data[i]['answer']['posted_by_view']['id'];
            if(login_userid === posted_userid){
              var mypage_id = ''
            }else{
              var mypage_id = 'userid=' + posted_userid + '&';
            }
            var mypage2 = 'mypage.html?' + mypage_id + 'message_type=' + NarikiriAPI.MessageType.ANSWER;
            var sentence_a = data[i]['answer']['sentence'];
            var like_a = data[i]['answer']['vote_status']['number'];
            var like;
            if(like_a === 0){like = ''}else{like = like_a + '件'};
            var voted = data[i]['answer']['vote_status']['voted'];
            var g_poine_icon = data[i]['answer']['vote_status']['by_role'];
            var question_count = data[i]['answer']['reply_count'];
            var id_a = data[i]['answer']['id'];
            var outou2 = 'outou2.html?id=' + id_a;
            var posted_a = Date.parse(data[i]['answer'].posted_at);
            var duration_a = calcDuration(now-posted_a);
            }

            //質問
            var html_q =
            '<div class="left">'+
            '<a href="'+mypage+'"><img src="'+thumbnail_q+'" alt="'+name_q+'" class="prf-thumb"></a>'+
            '</div>'+
            '<div class="right">'+
            '<div class="r-name">'+
            '<span class="prf-name"><a href="'+mypage+'">'+name_q+'</a></span>'+
            '<span class="tstamp">'+duration_q+'</span>'+
            '</div>'+
            '<p class="honbun"><a href="'+outou1+'">'+sentence_q+'</a></p>'+
            '<div class="r-small">'+
            '<span class="outou-icon"><a href="'+outou1+'">なりきり応答する</a> '+reply_count+'件</span>'+
            '</div>'+
            '</div>';

            //回答
            var html_a =
            '<div class="' + (g_poine_icon ? 'list-outou-certificate' : 'list-outou') + ' clearfix">'+
            '<div>'+
            '<p class="ninki-outou">人気の応答</p>'+
            '<a href="'+mypage2+'"><img src="'+thumbnail_a+'" alt="'+name_a+'" class="prf-thumb"></a>'+
            '<div class="fuki-name">'+
            '<span class="prf-name"><a href="'+mypage2+'">'+name_a+'</a></span>'+
            '<span class="tstamp">'+duration_a+'</span>'+
            '</div>'+
            '<p class="fuki-honbun"><a href="'+outou2+'">'+sentence_a+'</a></p>'+
            '</div>'+
            '<div class="fuki-small">'+
            '<span class="shitsumon-icon"><a href="'+outou2+'">質問する</a> '+question_count+'件</span>'+
            '<span class="' + (voted ? 'poine-icon-on' : 'poine-icon') + '"><a href="#" data-id="'+id_a+'" data-voted="'+voted+'" data-like_a="'+like_a+'">'+like+'&nbsp;</a></span>'+
            '</div>'+
            '</div>';
            if(data[i]['answer']){
              var html = $('<li class="clearfix">' + html_q + html_a + '</li>');
            }else{
              var html = $('<li class="clearfix">' + html_q + '</li>');
              html.find('.right').css('background', 'none').css('padding-bottom', '0');
            }
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
              }})
          });
          //「さらに読み込む」の表示・非表示
          if (data.has_next) {
            $('.more-loading').show();
          } else {
            $('.more-loading').hide();
          }
      }, redirectToErrorPages);
    }

    //さらに読む
    var page = 1;
    $('.more-loading').on('click', function (e) {
        e.preventDefault();
        Loading.show();
        showList(page, orderBy).done(function() {
          Loading.hide();
        });
        page++;
    });

    $('#form .button-area .button').on('click', function(e) {
        e.preventDefault();

        var text = $('#shitsumon-area').val();
        if (text.length < 1) {
            return;
        }
        api.postQuestion(text).done(function() {
            setPostCompleteAnimation();
            location.reload();
        }).fail(modalSendMessageError);
    });

    $('#sort').on('change', function(e) {
        e.preventDefault();
        location.href = location.protocol + '//' + location.hostname + location.pathname + '?order_by=' + $('#sort').val();
    });
});
