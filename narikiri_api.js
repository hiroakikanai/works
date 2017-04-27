(function(app) {
  var createFailHandler = function(role) {
    return function(xhr) {
      if (xhr.status == 401) {
        if (!app.Login.isProcessing() && !app.Login.isLoggedOut()) {
          app.Login.redirectToLoginPage(role);
        }
      } else if (xhr.status == 403) {
        try {
          if (JSON.parse(xhr.responseText).type == '/not-member') {
            app.Login.logout(app.RoleSetting.channelUrl);
          }
        } catch (e) { }
      }
      return $.Deferred().reject(xhr);
    };
  };

  var request = function(role, path, method, data, dataType) {
    var params = $.extend({}, data);
    for (var key in data) {
      if (data[key] === null) {
        delete params[key];
      }
    }

    if (method !== 'GET') {
      params = JSON.stringify(params);
    }
    var token = app.User.getToken();
    var setting = {
      url: app.Setting.API_DOMAIN + path,
      method: method,
      dataType: dataType,
      contentType: 'application/json; charset=utf-8',
      data: params,
      headers: { Authorization: 'Bearer ' + token }
    };
    if ($.isEmptyObject(params)){
      delete setting.contentType;
    }
    if ((token || "").length < 1) {
      delete setting.headers.Authorization;
    }

    return $.ajax(setting)
      .then(function(json, status, xhr) {
        if (json) {
          json.has_next = (xhr.getResponseHeader("Link") || "").length > 0;
        }
        return $.Deferred().resolve(json, status, xhr);
      }, createFailHandler(role));
  };

  var fillEmptyListFilter = function() {
    return function(json, status, xhr) {
      if (xhr.status == 204) {
        json = [];
        json.has_next = false;
      }
      return $.Deferred().resolve(json, status, xhr);
    };
  };

  var createDoneFilter = function(callback) {
    return function(json, status, xhr) {
      if (xhr.status != 204) {
        json = callback(json);
      }
      return $.Deferred().resolve(json, status, xhr);
    };
  };

  var MessageType = {
    QUESTION: 0,
    ANSWER: 1
  };

  var appendActorIntoMessage = function(message) {
    var postedByView = {
      id: message.posted_by.id
    };
    if (message.posted_by.by_role) {
      postedByView.name = app.RoleSetting.origin.name;
      postedByView.thumbnail_url = app.RoleSetting.origin.thumbnail_url;
    } else if (message.message_type === MessageType.QUESTION) {
      postedByView.name = message.posted_by.name;
      postedByView.thumbnail_url = message.posted_by.thumbnail_url;
    } else {
      postedByView.name = message.role.acting_name;
      postedByView.thumbnail_url = message.role.acting_thumbnail_url;
    }

    message.posted_by_view = postedByView;
    return message;
  };

  var appendActorIntoMessageList = function(messages) {
    $.each(messages, function(index, message) {
      appendActorIntoMessage(message);
    });
    return messages;
  };

  // APIを初期化する
  //
  // @params {string} 掲示板のパス(ex: maxmurai、oreimo-ayase)
  var NarikiriAPI = function(slug) {
    this.slug = slug;
    this.rolePath = '/roles/' + slug;
  };

  $.extend(true, NarikiriAPI.prototype, {
    // シーンの一覧を取得する
    getScenes: function() {
      return this._GET(this._createPath('/scenes'));
    },

    // 現在のペア数/目標ペア数を取得する
    getStats: function() {
      return this._GET(this._createPath('/stats'));
    },

    // TOPで表示する質問・応答のペアを取得する
    //
    // @param {number} limit 取得上限数
    // @param {number} page 取得するページ番号
    // @param {string} orderBy ソート順
    getTopContents: function(limit, page, orderBy) {
      return this._GET(this._createPath('/pickup-pairs'), {
        limit: limit,
        offset: limit * page,
        order_by: orderBy
      }).then(fillEmptyListFilter())
        .then(createDoneFilter(function(json) {
          $.each(json, function(i, pair) {
            pair.question = appendActorIntoMessage(pair.question);
            if (pair.answer) {
              pair.answer = appendActorIntoMessage(pair.answer);
            }
          });
          return json;
        }));
    },

    // 自分の投稿した質問を削除する
    //
    // @param {string} questionId 削除する質問のID
    removeQuestion: function(questionId) {
      return this._removeMessage(questionId);
    },

    // 自分の投稿した応答を削除する
    //
    // @param {string} answerId 削除する応答のID
    removeAnswer: function(answerId) {
      return this._removeMessage(answerId);
    },

    // 応答に対応する質問の一覧を取得する
    //
    // @params {string} answerId 対象の応答のID
    // @param {number} limit 取得上限数
    // @param {number} page 取得するページ番号
    // @param {string} orderBy ソート順
    getQuestions: function(answerId, limit, page, orderBy) {
      return this._getReplies(answerId, limit, page, orderBy);
    },


    // 質問に対応する応答の一覧を取得する
    //
    // @params {string} questionId 対象の質問のID
    // @param {number} limit 取得上限数
    // @param {number} page 取得するページ番号
    // @param {string} orderBy ソート順
    getAnswers: function(questionId, limit, page, orderBy) {
      return this._getReplies(questionId, limit, page, orderBy);
    },

    // ぽいねを取り消す
    //
    // @params {string} ぽいねを取り消す対象の応答
    cancelVote: function(answerId) {
      return this._processVote(answerId, false);
    },

    // ぽいねを投票する
    //
    // @params {string} ぽいねを投票する対象の応答
    vote: function(answerId) {
      return this._processVote(answerId, true);
    },

    // 質問を投稿する
    //
    // @params {string} text 質問本文
    // @params {string} answerId 対応する応答のID。無い場合は指定しない
    postQuestion: function(text, answerId) {
      var data = {
        sentence: text,
        message_type: MessageType.QUESTION
      };
      if ((answerId || '').length < 1) {
        return this._POST(this._createPath('/messages'), data).then(createDoneFilter(appendActorIntoMessage));
      } else {
        return this._POST(this._createPath('/messages/' + answerId + '/replies'), data).then(createDoneFilter(appendActorIntoMessage));
      }
    },

    // 応答を投稿する
    //
    // @params {string} text 応答本文
    // @params {string} questionId 対応する質問のID
    postAnswer: function(text, questionId) {
      var data = {
        sentence: text,
        message_type: MessageType.ANSWER
      };
      return this._POST(this._createPath('/messages/' + questionId + '/replies'), data).then(createDoneFilter(appendActorIntoMessage));
    },

    // 特定のユーザーの質問一覧を取得する
    //
    // @params {string} userId ユーザーのID
    // @param {number} limit 取得上限数
    // @param {number} page 取得するページ番号
    // @param {string} orderBy ソート順
    getUserQuestions: function(userId, limit, page, orderBy) {
      return this._getUserMessages(userId, MessageType.QUESTION, limit, page, orderBy);
    },

    // 特定のユーザーの応答一覧を取得する
    //
    // @params {string} userId ユーザーのID
    // @param {number} limit 取得上限数
    // @param {number} page 取得するページ番号
    // @param {string} orderBy ソート順
    getUserAnswer: function(userId, limit, page, orderBy) {
      return this._getUserMessages(userId, MessageType.ANSWER, limit, page, orderBy);
    },

    // 指定した質問、または応答のIDから、ペアの最初の質問までを取得する
    //
    // @params {string} 質問、または応答のID
    getQuestionTree: function(id) {
      return this._GET(this._createPath('/messages/' + id + '/histories'))
        .then(fillEmptyListFilter())
        .then(createDoneFilter(appendActorIntoMessageList));
    },

    // 特定のユーザーの名前や投稿数などを取得する
    //
    // @params {string} ユーザーのID
    getUserStats: function(userId) {
      var userInfo = this._GET(this._createPath('/users/' + userId))
        .then(createDoneFilter(function(data) {
          if (data.by_role) {
            data.thumbnail_url = RoleSetting.origin.thumbnail_url;
            data.name = RoleSetting.origin.name;
          }
          return data;
        }), createFailHandler(this.slug));
      var stats = this._GET(this._createPath('/users/' + userId + '/stats'));
      return $.when(userInfo, stats).then(function(userInfoResponse, statsResponse) {
        var data = $.extend({}, userInfoResponse[0], statsResponse[0]);
        return $.Deferred().resolve(data, userInfoResponse[1], userInfoResponse[2]);
      }, createFailHandler(this.slug));
    },

    // 自分の名前や投稿数などを取得する
    getMyStats: function() {
      var userInfo = this._GET(this._createPath('/users/own'))
        .then(createDoneFilter(function(data) {
          if (data.by_role) {
            data.thumbnail_url = RoleSetting.origin.thumbnail_url;
            data.name = RoleSetting.origin.name;
          }
          return data;
        }, createFailHandler(this.slug)));
      var stats = this._GET(this._createPath('/users/own/stats'));
      return $.when(userInfo, stats).then(function(userInfoResponse, statsResponse) {
        var data = $.extend({}, userInfoResponse[0], statsResponse[0]);
        return $.Deferred().resolve(data, userInfoResponse[1], userInfoResponse[2]);
      }, createFailHandler(this.slug));
    },

    // 匿名ユーザーに設定する
    changeToAnonymouse: function() {
      return this._PATCH(this._createPath('/users/own'), { anonymous: true }, 'text');
    },

    // 匿名ユーザーの設定を解除する
    changeToOnymous: function() {
      return this._PATCH(this._createPath('/users/own'), { anonymous: false }, 'text');
    },

    _removeMessage: function(messageId) {
      return this._DELETE(this._createPath('/messages/' + messageId));
    },

    _getReplies: function(messageId, limit, page, orderBy) {
      return this._GET(this._createPath('/messages/' + messageId + '/replies'), {
        limit: limit,
        offset: limit * page,
        order_by: orderBy
      }).then(fillEmptyListFilter())
        .then(createDoneFilter(appendActorIntoMessageList));
    },

    _getUserMessages: function(userId, messageType, limit, page, orderBy) {
      return this._GET(this._createPath('/users/' + userId + '/messages'), {
        user_id: userId,
        message_type: messageType,
        limit: limit,
        offset: limit * page,
        order_by: orderBy
      }).then(fillEmptyListFilter())
        .then(createDoneFilter(appendActorIntoMessageList));
    },

    _createPath: function(path) {
      return this.rolePath + '/' + path.replace(/^\//, "");
    },

    _voteStatus: {},

    _WAIT_TIME: 500,

    _processVote: function(answerId, vote) {
      var sendLast = function(lastVote) {
        this._voteStatus[answerId].timerId = null;
        if (this._voteStatus[answerId].status != lastVote) {
          this._processVote(answerId, lastVote);
        }
      };

      var result = $.Deferred().resolve({});
      if (!this._voteStatus[answerId] || !this._voteStatus[answerId].timerId) {
        result = this._sendVote(answerId, vote);
        this._voteStatus[answerId] = { status: vote };
      } else {
        clearTimeout(this._voteStatus[answerId].timerId);
      }
      this._voteStatus[answerId].timerId = setTimeout(sendLast.bind(this, vote), this._WAIT_TIME);
      return result;
    },

    _sendVote: function(answerId, vote) {
      if (vote) {
        return this._PUT(this._createPath('/messages/' + answerId + '/votes'));
      } else {
        return this._DELETE(this._createPath('/messages/' + answerId + '/votes/own'));
      }
    },

    _GET: function(path, data, dataType) {
      return request(this.slug, path, 'GET', data || {}, dataType || 'json');
    },

    _POST: function(path, data, dataType) {
      return request(this.slug, path, 'POST', data || {}, dataType || 'json');
    },

    _DELETE: function(path, data, dataType) {
      return request(this.slug, path, 'DELETE', data || {}, dataType || 'json');
    },

    _PUT: function(path, data, dataType) {
      return request(this.slug, path, 'PUT', data || {}, dataType || 'json');
    },

    _PATCH: function(path, data, dataType) {
      return request(this.slug, path, 'PATCH', data || {}, dataType || 'json');
    }
  });

  NarikiriAPI.MessageType = MessageType;

  app.NarikiriAPI = NarikiriAPI;
})(window);
