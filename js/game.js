define(function(require,exports,module) {
    //→←↑↓
    try {
        var appCache = window.applicationCache;

        appCache.update(); // 开始更新

        if (appCache.status == window.applicationCache.UPDATEREADY) {
            appCache.swapCache();  // 得到最新版本缓存列表，并且成功下载资源，更新缓存到最新
        }
    } catch (e) {
        console.log(e)
    }

    var mainTemplate = _.template(require("../layout/main_window.html"));

    var secretWords = {
        "地点":[
            "飞机","银行","海滩","马戏场","公司聚会","赌场","温泉","大使馆","医院","旅馆",
            "军事基地","电影棚","豪华邮轮","客运列车","海盗船","极地","警察局","饭店","学校","4S店",
            "太空站","潜艇","超市","剧院","大学"
        ]
    }

    var startGame = function() {
        $(".game-mode-select").show();
        $(".game-area").hide();
    }

    $("body").append("<div class='main-window-wrapper'></div>")

    $("body .main-window-wrapper").empty();
    $("body .main-window-wrapper").html(mainTemplate());

    $(".start-game").on("click", function(){
        number = $(".player-number-select").val()
        var theme = "地点";
        window.gameStatus = {
            playerNumber : number,
            currentPlayer: 0,
            spyPlayer: Math.floor(Math.random()*number),
            theme: theme,
            secretWord: getRandomItem(secretWords[theme])
        }
        $(".game-area").show();
        $(".topic-type").html(theme);
        $(".secret-word").html(gameStatus.secretWord)
        $(".game-mode-select").hide();
        $(".see-identity").show();
    })

    $(".see-identity").on("click",function(){
        $(".pass-to-next-player-label").hide();
        $(".see-identity").hide();
        $(".identity").show();
        $(".confirm-identity").show();
        if ( gameStatus.currentPlayer == gameStatus.spyPlayer ) {
            $(".you-are-spy").show();
            $(".you-are-agent").hide();
        } else {
            $(".you-are-spy").hide();
            $(".you-are-agent").show();
        }
    })

    $(".confirm-identity").on("click",function(){
        $(".identity").hide();
        $(".confirm-identity").hide();
        gameStatus.currentPlayer ++;
        if ( gameStatus.currentPlayer >= gameStatus.playerNumber ) {
            $(".begin-question").show();
        } else {
            $(".begin-question").hide();
            $(".pass-to-next-player-label").show();
            $(".see-identity").show();
        }
    })

    $(".begin-question").on("click",function(){
        $(".begin-question").hide();
        $(".show-me-answer").show();
    });

    $(".show-me-answer").on("click",function(){
        $(".show-me-answer").hide();
        $(".answer-label").html((gameStatus.spyPlayer+1)+"号玩家是间谍；暗号是"+gameStatus.secretWord);
        $(".answer").show();
    });

    $(".start-new-game").on("click",function(){
        $(".answer").hide();
        startGame();
    })

    startGame()
});