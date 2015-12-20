define(function(require,exports,module) {
    var mainTemplate = _.template(require("../layout/main_window.html"));

    var wordTypes = ["地点","职业"];
    var secretWords = {
        "地点":[
            "飞机","银行","海滩","马戏团","公司聚会","赌场","温泉","大使馆","医院","旅馆",
            "军事基地","电影院","豪华邮轮","客运列车","海盗船","极地工作站","警察局","饭店","学校","4S店",
            "太空站","潜艇","超市","剧院","大学","教堂"
        ],
        "职业":[
           "教师","学生","医生","警察","服务员","拳击手","驯兽师","工程师","消防员","议员",
            "牧师","推销员","律师","农民","司机","士兵","水手","厨师","会计","总统",
            "兽医","修理工","设计师","翻译","作家","飞行员"
        ]
    }

    var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var salt = "salt is salty"
    var encode = function(id) {
        var hashids = new Hashids(salt, 6, alphabet);
        return hashids.encode(id)
    }
    var decode = function(hashid) {
        var hashids = new Hashids(salt, 6, alphabet);
        return hashids.decode(hashid);
    }

    var currentHashCode;
    var currentTypeIndex;
    var currentType;
    var currentWordIndex;
    var currentSecret;
    var currentPlayerNumber;
    var currentSeatNumber;
    var currentSpies;
    var onInputHash  = function(){
        var code = $(this).val().trim();
        if ( decodeHashCode(code) ) {
            $(".start-game").prop("disabled",false);
        } else $(".start-game").prop("disabled",true);
    };

    var initialize = function(){
        currentHashCode = 0;
        currentType = null;
        currentSecret = null;
        currentPlayerNumber = 0;
        currentSpies = [];

        $(".player-number-select").empty();

        for ( var i = 4; i <= 16; i++ ) {
            var opt = $('<option class="player-number-option" >'+i+'</option>')
            $(".player-number-select").append(opt)
        }
    }

    var decodeHashCode = function(hashid){
        hashid = hashid.toUpperCase();
        var code = decode(hashid);
        if ( code && code.length == 1 ) {
            code = code[0]
            currentTypeIndex = code & 3;
            currentType = wordTypes[currentTypeIndex]; //2bit
            code = code >> 2;
            currentWordIndex = code & 0x3f; //6bit
            currentSecret = secretWords[currentType][currentWordIndex];
            code = code >> 6;
            currentPlayerNumber = code & 0xf; //4bit
            currentPlayerNumber += 4;
            code = code >> 4;
            currentSpies = [];
            currentSpies.push( code & 0xf );//4bit
            code = code >> 4;
            if ( currentPlayerNumber >= 10 ) {
                currentSpies.push( code & 0xf );//4bit
                code = code >> 4;
            }
            currentSeatNumber = code & 0xf; //4bit
            code = code >> 4;
            return true;
        } else {
            return false;
        }
    }

    var encodeHashCode = function(typeIndex, wordIndex, playerNumber, currentSpies, seatNumber){
        var code = (currentSpies[0]<<12) | ((playerNumber-4) << 8) | (wordIndex << 2) | typeIndex;
        if ( currentSpies.length === 2 ) {
            code |= (seatNumber<<20) | (currentSpies[1]<<16);
        } else {
            code |= (seatNumber<<16);
        }
        return encode(code);
    }

    var isSpy = function( seatNumber ) {
        return _.indexOf(currentSpies, seatNumber) != -1;
    }

    $("body").append("<div class='main-window-wrapper'></div>")

    $("body .main-window-wrapper").empty();
    $("body .main-window-wrapper").html(mainTemplate());

    var allPages = $(".game-page");
    var showGamePage = function(pageName) {
        allPages.hide();
        $(".game-page."+pageName).show();
    }

    var jumpByHash = function(hash){
        if ( !hash ) {
            window.location.hash = "choose-device";
        } else {
            if ( hash.indexOf("join-sync") === 0 ) {
                $(".seat-number-select").empty();
                for ( var i = 1; i <= 15; i++ ) {
                    $(".seat-number-select").append("<option class='seat-number-option'>"+(i+1)+"</option>")
                }

                showGamePage("join-sync");
                var parts = hash.split("_");
                if (parts.length === 2) {
                    currentHashCode = parts[1];
                    $(".hashid-input").val(currentHashCode);
                    onInputHash.call($(".hashid-input")[0]);
                } else {
                    $(".start-game").prop("disabled",true);
                }
            } else if ( hash.indexOf("host-sync") === 0) {
                var parts = hash.split("_");
                if (parts.length === 2) {
                    currentHashCode = parts[1];
                    if ( !decodeHashCode(currentHashCode) ) {
                        window.location.hash = "choose-device";
                        return;
                    } else {
                        currentSeatNumber = 0;
                        showGamePage("host-sync");
                        $(".hashid").text(currentHashCode);
                    }
                } else {
                    window.location.hash = "choose-device";
                    return;
                }
            }  else if ( hash.indexOf("multi-setup") === 0) {
                var parts = hash.split("_");
                if (parts.length === 2) {
                    currentHashCode = parts[1];
                    if ( !decodeHashCode(currentHashCode) ) {
                        window.location.hash = "choose-device";
                        return;
                    } else {
                        showGamePage("multi-setup");
                        $(".confirm-identity").show();
                        $(".see-identity").show();
                        $(".seat-number").show();
                        $(".seat-number").text(currentSeatNumber+1);
                        $(".word-type").text(currentType);
                        var allWords = secretWords[currentType].join(" , ");
                        $(".all-words-section").show();
                        $(".all-words").text(allWords);
                        if ( investigationInterval ) clearInterval(investigationInterval);
                        if ( currentSeatNumber == 0 ) {
                            $(".start-investigation").show();
                        } else {
                            $(".start-investigation").hide();
                        }
                        $(".countdown").hide();
                        $(".show-me-answer").hide();
                        $(".answer-section").hide();
                    }
                } else {
                    window.location.hash = "choose-device";
                    return;
                }
            }  else if ( hash.indexOf("single-setup") === 0) {
                var parts = hash.split("_");
                if (parts.length === 2) {
                    currentHashCode = parts[1];
                    if ( !decodeHashCode(currentHashCode) ) {
                        window.location.hash = "choose-device";
                        return;
                    } else {
                        showGamePage("single-setup");
                        $(".confirm-identity").show();
                        $(".see-identity").show();
                        $(".seat-number").show();
                        $(".seat-number").text(currentSeatNumber+1);
                        $(".word-type").text(currentType);
                        var allWords = secretWords[currentType].join(" , ");
                        $(".all-words-section").show();
                        $(".all-words").text(allWords);

                        if ( investigationInterval ) clearInterval(investigationInterval);
                        $(".start-investigation").hide();
                        $(".countdown").hide();
                        $(".show-me-answer").hide();
                        $(".answer-section").hide();
                    }
                } else {
                    window.location.hash = "choose-device";
                    return;
                }
            } else {
                if ( hash == "choose-device" ) {
                    initialize();
                }
                showGamePage(hash);
            }
        }
    }

    var hash = location.hash.substr(1);
    jumpByHash(hash);

    window.onhashchange=function(){
        var hash = window.location.hash.substr(1);
        jumpByHash(hash);
    }

    var generateData = function(){
        currentTypeIndex = Math.floor(Math.random()*wordTypes.length);
        currentType = wordTypes[currentTypeIndex];
        currentWordIndex = Math.floor(Math.random()*secretWords[currentType].length);
        currentSecret = secretWords[currentType][currentWordIndex];
        currentSpies = [];
        if ( currentPlayerNumber < 10 ) {
            var spyNumber = Math.floor(Math.random()*currentPlayerNumber);
            currentSpies.push(spyNumber);
        } else {
            var candidates = [];
            for ( var i = 0; i < currentPlayerNumber; i++ ) candidates.push(i);
            var spyNumbers = _.sample(candidates,2);
            currentSpies.push(spyNumbers[0]);
            currentSpies.push(spyNumbers[1]);
        }

    }

    $(".host-multi-dev-game").on("click",function(){
        currentPlayerNumber = $(".player-number-select").val();
        generateData();
        currentSeatNumber = 0;
        currentHashCode = encodeHashCode(currentTypeIndex, currentWordIndex, currentPlayerNumber, currentSpies, currentSeatNumber )
        window.location.hash = "host-sync_"+currentHashCode;
    });

    $(".join-multi-dev-game").on("click",function(){
        currentPlayerNumber = $(".player-number-select").val();
        window.location.hash = "join-sync"
    });


    $(".hashid-input").on("input", onInputHash);

    $(".start-game").on("click",function(){
        if ( hash.indexOf("join-sync") === 0 ) {
            currentSeatNumber = $(".seat-number-select").val() - 1;
        }
        var code = encodeHashCode(currentTypeIndex, currentWordIndex, currentPlayerNumber, currentSpies, currentSeatNumber )
        window.location.hash = "multi-setup_"+code;
    });

    $(".host-single-dev-game").on("click",function(){
        currentPlayerNumber = $(".player-number-select").val();
        generateData();
        var code = encodeHashCode(currentTypeIndex, currentWordIndex, currentPlayerNumber, currentSpies, 0 )
        window.location.hash = "single-setup_"+code;
    });


    var onMouseDown = function(){
        if ( isSpy(currentSeatNumber) ) {
            $(".you-are-spy").show();
        } else {
            $(".secret-word").text(currentSecret);
            $(".you-are-agent").show();
        }
    };
    var onMouseUp = function(){
        if ( isSpy(currentSeatNumber) ) {
            $(".you-are-spy").hide();
        } else {
            $(".secret-word").text(currentSecret);
            $(".you-are-agent").hide();
        }
    };
    $(".see-identity").on("mousedown",onMouseDown);
    $(".see-identity").on("touchstart",onMouseDown);
    $(".see-identity").on("mouseup",onMouseUp);
    $(".see-identity").on("touchend",onMouseUp);

    $(".confirm-identity").on("click",function(){
        currentSeatNumber++;
        if ( currentSeatNumber < currentPlayerNumber ) {
            $(".seat-number").text(currentSeatNumber+1);
        } else {
            $(".seat-number").hide();
            $(".confirm-identity").hide();
            $(".see-identity").hide();
            $(".start-investigation").show();
        }
    })

    var investigationTime;
    var investigationInterval;
    $(".start-investigation").on("click",function(){
        $(".start-investigation").hide();
        $(".countdown").show();
        investigationTime = Math.min(currentPlayerNumber,10) * 60+1;
        if ( investigationInterval ) clearInterval(investigationInterval);
        investigationInterval = setInterval(function(){
            investigationTime --;
            var minute = Math.floor(investigationTime/60);
            var sec = investigationTime%60;
            $(".countdown").html( (minute<10?"0":"")+minute+":"+(sec<10?"0":"")+sec);
            if (investigationTime<=0){
                var audio = new Audio('./alarm.mp3');
                audio.play();
                clearInterval(investigationInterval);
                $(".countdown").hide();
                $(".show-me-answer").show();
            }
        },1000);
    });

    $(".show-me-answer").on("click",function(){
        $(".show-me-answer").hide();
        $(".all-words-section").hide();
        var spyText;
        if ( currentSpies.length === 1 ) {
            spyText = (currentSpies[0]+1)+"号位玩家"
        } else {
            if ( currentSpies[0] < currentSpies[1] ) {
                spyText = (currentSpies[0] + 1) + "号位和" + (currentSpies[1] + 1) + "号位玩家"
            } else spyText = (currentSpies[1] + 1) + "号位和" + (currentSpies[0] + 1) + "号位玩家"
        }
        $(".answer-section").show();
        $(".answer-label").text("间谍是："+spyText+"，暗号是："+currentSecret);
    })

    $(".restart-game").on("click",function(){
        window.location.hash = "choose-device";
    });
    /*
        $(".start-game").on("click", function(){
            number = $(".player-number-select").val()
            var theme = getRandomItem(_.keys(secretWords));
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
            //start countdown
            $(".countdown").show();
            window.gameStatus.time = window.gameStatus.playerNumber * 60+1;
            window.gameStatus.interval = setInterval(function(){
                window.gameStatus.time --;
                var minute = Math.floor(window.gameStatus.time/60);
                var sec = window.gameStatus.time%60;
                $(".countdown").html( (minute<10?"0":"")+minute+":"+(sec<10?"0":"")+sec);
                if (window.gameStatus.time<=0){
                    var audio = new Audio('./alarm.mp3');
                    audio.play();
                    clearInterval(window.gameStatus.interval);
                    $(".countdown").hide();
                    $(".show-me-answer").show();
                }
          },1000);
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
    */

});