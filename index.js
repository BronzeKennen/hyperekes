const WsSubscribers = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function(port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        if (debug) {
            if (debugFilters !== undefined) {
                console.warn("WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped");
            } else {
                console.warn("WebSocket Debug Mode enabled without filters applied. All events will be dumped to console");
                console.warn("To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function");
            }
        }
        WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
        WsSubscribers.webSocket.onmessage = function (event) {
            let jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers.webSocket.onopen = function () {
            WsSubscribers.triggerSubscribers("ws", "open");
            WsSubscribers.webSocketConnected = true;
            WsSubscribers.registerQueue.forEach((r) => {
                WsSubscribers.send("wsRelay", "register", r);
            });
            WsSubscribers.registerQueue = [];
        };
        WsSubscribers.webSocket.onerror = function () {
            WsSubscribers.triggerSubscribers("ws", "error");
            WsSubscribers.webSocketConnected = false;
        };
        WsSubscribers.webSocket.onclose = function () {
            WsSubscribers.triggerSubscribers("ws", "close");
            WsSubscribers.webSocketConnected = false;
        };
    },
    /**
    * Add callbacks for when certain events are thrown
    * Execution is guaranteed to be in First In First Out order
    * @param channels
    * @param events
    * @param callback
    */
    subscribe: function(channels, events, callback) {
        if (typeof channels === "string") {
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function(c) {
            events.forEach(function (e) {
                if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers.__subscribers[c] = {};
                }
                if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers.__subscribers[c][e] = [];
                    if (WsSubscribers.webSocketConnected) {
                        WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers.__subscribers[c][e].push(callback);
            });
        })
    },
    clearEventCallbacks: function (channel, event) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function (channel, event, data) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel][event].forEach(function(callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function (channel, event, data) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            let cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};


///
/*
    game:replay_start
    game:replay_end
    game:pre_countdown_begin
    game:post_countdown_begin
    game:statfeed_event
    game:goal_scored
*/
function getValue(){
    var value= $.ajax({ 
        url: 'livematch.json', 
        async: false
    }).responseText;

    return JSON.parse(value);
}

function getTeams(i){
    var value= $.ajax({ 
        url: 'https://cwxskbsjnovkyqeloumw.supabase.co/rest/v1/rpc/getteams',
        async: false,
        headers: {'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E'}
    }).responseText;

    return JSON.parse(value);
}

var circle = $('.boost-focused .progress-ring .progress-ring_circle');
var radius = 98;
var perimetros = radius * 2 * Math.PI;
circle.css('strokeDasharray' , `${perimetros} ${perimetros}`);
circle.css('strokeDashoffset' , `${perimetros}`);

function setProgress(percent) {
    const offset = perimetros - percent / 100 * perimetros;
    circle.css('strokeDashoffset' , `${offset}`);
}
$(".replay-cam").hide();
$(".bg").hide();
// $('.body').hide();
$(() => {
    WsSubscribers.init(49322, true);
    for(let i = 0; i<4;i++) {
        $(`.orange-points #orange${i}`).hide();
        $(`.blue-points #blue${i}`).hide();
    }
    var in_replay = 0;
    var match_ended = 0;
    var scorer = 'none';
    var speed;
    var playmaker;
    var livematch;
    var livematches = getValue();
    var next_up;
    for(let i = 0; i < 4; i++) {
        if (livematches[i]["active"] === 1) {
            livematch = livematches[i];
            // next_up = livematches[i+1];
        }
    }
    // var livematch = getValue();

    var teams = getTeams();
    var blue_team_logo;
    var orange_team_logo;
    // var next_up_blue;
    // var next_up_orange;
    $('#nextup').animate({
        left:-250
    })
    for(let i = 0; i < teams.length; i++) {
        if(teams[i]['name'] === livematch["blue_team"]["display_name"]) {
            blue_team_logo = teams[i]['logo'];            
        } else if (teams[i]['name'] === livematch['orange_team']['display_name']){
            orange_team_logo = teams[i]['logo'];
        }
    }
    // for(let i = 0; i < teams.length; i++) {
    //     if(teams[i]['name'].toUpperCase() === next_up["blue_team"]["display_name"]) {
    //         next_up_blue = teams[i]['logo'];
    //     } else if (teams[i]['name'].toUpperCase() === next_up['orange_team']['display_name']){
    //         next_up_orange = teams[i]['logo'];
    //     }
    // }


    WsSubscribers.subscribe("game", "update_state", (d) => {
        $(".team-info .blue-score").text(d['game']['teams'][0]['score']);
        $(".team-info .orange-score").text(d['game']['teams'][1]['score']);
        var latestballspeed = d.game.ballSpeed;
        var gtime = Math.floor(Math.ceil(d.game.time_seconds) / 60);
        var gsecs = Math.ceil(Math.ceil(d.game.time_seconds) % 60);
        $(".team-info .blue").text(livematch["blue_team"]["display_name"].toUpperCase());
        $(".team-info .orange").text(livematch["orange_team"]["display_name"].toUpperCase());
        $(".team-info .logo-blue").attr("src", blue_team_logo);
        $(".team-info .logo-orange").attr("src", orange_team_logo);
        if (gsecs < 10)
            gsecs = "0" + gsecs;
        if (d.game.isOT)
            $(".team-info .time").text("+" + gtime + ":" + gsecs);
        else 
            $(".team-info .time").text(gtime + ":" + gsecs);
        

        var series_score = livematch["scores_csv"];
        series_score = series_score.split("-");
        // $(".scorebug-box .teams .series").text(livematch["scores_csv"]);
        // $(".scorebug-box .teams .series").text(series_score[0] + "-" + series_score[1]);
        for(let i = 0; i < series_score[0]; i++) {
            $(`.blue-points #blue${3-i}`).show();
        }
        for(let i = 0; i < series_score[1]; i++) {
            $(`.orange-points #orange${i}`).show();
        }

        $(".boost-focused").hide();
        if (d.game.target !== "") {
            setProgress(d['players'][d['game']['target']]['boost']);

            if (in_replay === 0 && match_ended === 0) {
                $(".camtarget").show();
                $(".boost-focused").show();
            } else {
                $(".blue-cam .target-replay .replay-spacing #saves").text(d['players'][scorer]['saves']);
                $(".blue-cam .target-replay .replay-spacing #goals").text(d['players'][scorer]['goals']);
                $(".blue-cam .target-replay .replay-spacing #assists").text(d['players'][scorer]['assists']);
                $(".blue-cam .target-replay .replay-spacing #shots").text(d['players'][scorer]['shots']);    

                $(".orange-cam .target-replay .replay-spacing #saves").text(d['players'][scorer]['saves']);
                $(".orange-cam .target-replay .replay-spacing #goals").text(d['players'][scorer]['goals']);
                $(".orange-cam .target-replay .replay-spacing #assists").text(d['players'][scorer]['assists']);
                $(".orange-cam .target-replay .replay-spacing #shots").text(d['players'][scorer]['shots']);    
            }
            $(".camtarget #playername").text(d['players'][d['game']['target']]['name'].toUpperCase());
            $(".camtarget .target-player #goals").text(d['players'][d['game']['target']]['goals']);
            $(".camtarget .target-player #assists").text(d['players'][d['game']['target']]['assists']);
            $(".camtarget .target-player #shots").text(d['players'][d['game']['target']]['shots']);
            $(".camtarget .target-player #saves").text(d['players'][d['game']['target']]['saves']);
            $(".camtarget .target-player #demos").text(d['players'][d['game']['target']]['demos']);
            $(".camtarget .target-player #touches").text(d['players'][d['game']['target']]['touches']);

            if ((d['players'][d['game']['target']]['team']) === 0) {
                $(".camtarget").css('background-image','url(target-player-blue.png)');
                $(".camtarget .target-player #goals").css('color' , 'white');
                $(".camtarget .target-player #saves").css('color' , 'white');
                $(".camtarget .target-player #assists").css('color' , 'white');
                $(".camtarget .target-player #touches").css('color' , 'white');
                $(".camtarget .target-player #demos").css('color' , 'white');
                $(".camtarget .target-player #shots").css('color' , 'white');
                $(".camtarget .logo-crop").css('background-image','url('+ blue_team_logo + ')');

                $(".progress-ring .progress-ring_circle").css('stroke', 'url(#gradient_blue)');
                $(".progress-ring #inner-cicrle").css('fill', '#253852');


            } else if ((d['players'][d['game']['target']]['team']) === 1) {
                $(".camtarget").css('background-image','url(target-player-orange.png)');
                $(".camtarget .target-player #goals").css('color' , 'black');
                $(".camtarget .target-player #saves").css('color' , 'black');
                $(".camtarget .target-player #assists").css('color' , 'black');
                $(".camtarget .target-player #touches").css('color' , 'black');
                $(".camtarget .target-player #demos").css('color' , 'black');
                $(".camtarget .target-player #shots").css('color' , 'black');
                $(".camtarget .logo-crop").css('background-image','url('+ orange_team_logo + ')');

                $(".progress-ring #inner-cicrle1").css('fill', '#46392a');
                $(".progress-ring .progress-ring_circle").css('stroke', 'url(#gradient_orange)');
            }
            $('#boost-text').text(d['players'][d['game']['target']]['boost']);
            $('#kph').text(d['players'][d['game']['target']]['speed'] + ' KM/H');
            $(".camtarget .target-speed .player.speed .speed").text(d['players'][d['game']['target']]['speed'] + " Km/h");

        } else {
            $(".camtarget").hide();
        }
        var x = 1;
        //BOOST GAUGES
        for (let player in d.players) {
            if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '1') {
                $(".playerboost .team.left.boost #data-boost1").text(d['players'][player]['boost']);
                $('#player1b .progress-bar').width(d['players'][player]['boost']-3.2 + "%");
                $(".playerboost .team.left.boost .boost-gauge-blue #name1").text(d['players'][player]['name'].toUpperCase());

            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '2') {
                $(".playerboost .team.left.boost #data-boost2").text(d['players'][player]['boost']);
                $(".playerboost .team.left.boost .boost-gauge-blue #name2").text(d['players'][player]['name'].toUpperCase());
                $('#player2b .progress-bar').width(d['players'][player]['boost']-3.2+ "%");
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '3') {
                $(".playerboost .team.left.boost #data-boost3").text(d['players'][player]['boost']);
                $(".playerboost .team.left.boost .boost-gauge-blue #name3").text(d['players'][player]['name'].toUpperCase());
                $('#player3b .progress-bar').width(d['players'][player]['boost']-3.2 + "%");
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '5') {
                $(".playerboost .team.right.boost #data-boost4").text(d['players'][player]['boost']);
                $('#player1l .progress-bar').width(d['players'][player]['boost']-3.2 + "%");
                $(".playerboost .team.right.boost .boost-gauge-orange #name4").text(d['players'][player]['name'].toUpperCase());
                
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '6') {
                $(".playerboost .team.right.boost #data-boost5").text(d['players'][player]['boost']);
                $(".playerboost .team.right.boost .boost-gauge-orange #name5").text(d['players'][player]['name'].toUpperCase());
                $('#player2l .progress-bar').width(d['players'][player]['boost']-3.2 + "%");
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '7') {
                $(".playerboost .team.right.boost #data-boost6").text(d['players'][player]['boost']);
                $(".playerboost .team.right.boost .boost-gauge-orange #name6").text(d['players'][player]['name'].toUpperCase());
                $('#player3l .progress-bar').width(d['players'][player]['boost']-3.2 + "%");

            }
            
        }
        // $('.post-game-blue .goals-team-blue').text(d['game']['teams'][0]['score'] + ' - ' + livematch["blue_team"]["display_name"]);
        $('.post-game-orange .goals-team-orange').text(d['game']['teams'][1]['score'] + ' - ' + livematch["orange_team"]["display_name"]);
        for (let player in d.players) {
            if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '1') {
                if (d['players'][player]['team'] === 0) {
                    $('.post-game-blue .goals-team-blue').text(d['game']['teams'][0]['score'] + ' - ' + livematch["blue_team"]["display_name"]);
                } else if (d['players'][player]['team'] === 1) {
                    $('.post-game-blue .goals-team-blue').text(d['game']['teams'][1]['score'] + ' - ' + livematch["orange_team"]["display_name"]);
                }
                $(`.post-game-orange #p1`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-orange #score1`).text(d['players'][player]['score']);
                $(`.post-game-orange #goals1`).text(d['players'][player]['goals']);
                $(`.post-game-orange #assists1`).text(d['players'][player]['assists']);
                $(`.post-game-orange #saves1`).text(d['players'][player]['saves']);
                $(`.post-game-orange #shots1`).text(d['players'][player]['shots']);
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '2') {
                $(`.post-game-orange #p2`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-orange #score2`).text(d['players'][player]['score']);
                $(`.post-game-orange #goals2`).text(d['players'][player]['goals']);
                $(`.post-game-orange #assists2`).text(d['players'][player]['assists']);
                $(`.post-game-orange #saves2`).text(d['players'][player]['saves']);
                $(`.post-game-orange #shots2`).text(d['players'][player]['shots']);
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '3') {
                $(`.post-game-orange #p3`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-orange #score3`).text(d['players'][player]['score']);
                $(`.post-game-orange #goals3`).text(d['players'][player]['goals']);
                $(`.post-game-orange #assists3`).text(d['players'][player]['assists']);
                $(`.post-game-orange #saves3`).text(d['players'][player]['saves']);
                $(`.post-game-orange #shots3`).text(d['players'][player]['shots']);

            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '5') {
                if (d['players'][player]['team'] === 0) {
                    $('.post-game-orange .goals-team-orange').text(d['game']['teams'][0]['score'] + ' - ' + livematch["blue_team"]["display_name"]);
                } else if (d['players'][player]['team'] === 1) {
                    $('.post-game-orange .goals-team-orange').text(d['game']['teams'][1]['score'] + ' - ' + livematch["orange_team"]["display_name"]);
                }
                $(`.post-game-blue #p1`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-blue #score4`).text(d['players'][player]['score']);
                $(`.post-game-blue #goals4`).text(d['players'][player]['goals']);
                $(`.post-game-blue #assists4`).text(d['players'][player]['assists']);
                $(`.post-game-blue #saves4`).text(d['players'][player]['saves']);
                $(`.post-game-blue #shots4`).text(d['players'][player]['shots']);
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '6') {
                $(`.post-game-blue #p2`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-blue #score5`).text(d['players'][player]['score']);
                $(`.post-game-blue #goals5`).text(d['players'][player]['goals']);
                $(`.post-game-blue #assists5`).text(d['players'][player]['assists']);
                $(`.post-game-blue #saves5`).text(d['players'][player]['saves']);
                $(`.post-game-blue #shots5`).text(d['players'][player]['shots']);
            }
            else if(d['players'][player]['id'].charAt(d['players'][player]['id'].length - 1) === '7') {
                $(`.post-game-blue #p3`).text(d['players'][player]['name'].toUpperCase());
                $(`.post-game-blue #score6`).text(d['players'][player]['score']);
                $(`.post-game-blue #goals6`).text(d['players'][player]['goals']);
                $(`.post-game-blue #assists6`).text(d['players'][player]['assists']);
                $(`.post-game-blue #saves6`).text(d['players'][player]['saves']);
                $(`.post-game-blue #shots6`).text(d['players'][player]['shots']);
            }
        }

        if (d['game']['hasWinner'] === true) {
            const result = {
                "winner_side" : d.winner_team_num
            };
            const res_json = JSON.stringify(result);
        }
    });

    WsSubscribers.subscribe("game", "goal_scored", (d) => {
        scorer = d['scorer']['id'];
        speed = d['goalspeed'];
        setTimeout(playVideo, 3100);


    });
    WsSubscribers.subscribe("game", "replay_start", (d) => {
        $(".boost-gauge-blue").animate({
            right:230
        });
        $(".boost-gauge-orange").animate({
            left:230
        });


        in_replay = 1;
        scorer_attr = scorer.split('_');

        $(".camtarget").hide();
        $(".replay-cam").show();
        if (playmaker !== 'none') {
            $(".blue-cam").css('background-image','url(BLUE_REPLAY_CARD_ASSISTS.png)');
            $(".orange-cam").css('background-image','url(ORANGE_REPLAY_CARD_ASSISTS.png)');
            $(".replay-cam .blue-cam #playmaker").text(playmaker.toUpperCase());
            $(".replay-cam .orange-cam #playmaker").text(playmaker.toUpperCase());
        } else {
            $(".blue-cam").css('background-image','url(BLUE_REPLAY_CARD.png)');
            $(".orange-cam").css('background-image','url(ORANGE_REPLAY_CARD.png)');
            $(".replay-cam .blue-cam #playmaker").text(' ');
            $(".replay-cam .orange-cam #playmaker").text(' ');
        }
        if (parseInt(scorer_attr[1]) < 4) {
            $(".orange-cam").hide();
            $(".blue-cam").show();
            $(".replay-cam .blue-cam #scorer").text(scorer_attr[0].toUpperCase());
            $(".replay-cam .blue-cam #speed").text(parseInt(speed));
        } else if (parseInt(scorer_attr[1]) > 4) {
            $(".orange-cam").show();
            $(".blue-cam").hide();
            $(".replay-cam .orange-cam #scorer").text(scorer_attr[0].toUpperCase());
            $(".replay-cam .orange-cam #speed").text(parseInt(speed));
        }
        $(".boost-focused").hide();
    });

    WsSubscribers.subscribe("game", "replay_will_end", (d) => {
        setTimeout(playVideo, 2000);
    });

    WsSubscribers.subscribe("game", "replay_end", (d) => {
        in_replay = 0;
        $(".boost-focused").show();
        $(".replay-cam").hide();

    });
    WsSubscribers.subscribe("game", "statfeed_event", (d) => {
        if (d['event_name'] === "Assist") {
            playmaker = d['main_target']['name'];
        } else {
            playmaker = 'none';
        }
    });
    WsSubscribers.subscribe("game", "match_ended", (d) => {
       
        in_replay = 0;
        match_ended = 1;
        setTimeout(playVideo, 5000);
        setTimeout(()=> {
            $(".scorebug-box").fadeOut(500);
            $('.team-info').fadeOut(500);
            $('.playerboost').fadeOut(500);
            $('.camtarget').fadeOut(500);
            $('.boost-focused').fadeOut(500);
            $('.bg').fadeIn(1500);
        },5000);
        
    });


    WsSubscribers.subscribe("game", "initialized", (d) => {
        match_ended = 0;
        setTimeout(playVideo, 1000);
        setTimeout(()=> {
            $(".scorebug-box").fadeIn(500);
            $('.team-info').fadeIn(500);
            $('.playerboost').fadeIn(500);
            $('.camtarget').fadeIn(500);
            $('.boost-focused').fadeIn(500);
            $('.bg').fadeOut(500);
        },2000);
        setTimeout(() => {
            $('#nextup').animate({
                left:0
            })
            setTimeout(() => {
                $('#nextup').animate({
                    left:-250
                })
            },5000);
        },100000);
        livematches = getValue();
        for(let i = 0; i < 4; i++) {
            if (livematches[i]["active"] === 1) {
                livematch = livematches[i];
                // next_up = livematches[i+1];
            }
        }
        series_score = livematch["scores_csv"];
        teams = getTeams();
        for(let i = 0; i < teams.length; i++) {
            if(teams[i]['name'] === livematch["blue_team"]["display_name"]) {
                blue_team_logo = teams[i]['logo'];
                
            } else if (teams[i]['name'] === livematch['orange_team']['display_name']){
                orange_team_logo = teams[i]['logo'];
            }
        }
        $("body").fadeIn(100);
    })

    WsSubscribers.subscribe("game", "pre_countdown_begin", (d) => {
        $('.scorebug-box').animate({
            top:0
        })
        setTimeout(function(){
            $(".boost-gauge-blue").animate({
                right:5
            });
            $(".boost-gauge-orange").animate({
                left:10
            });
        },750)
        

        for(let i = 0; i<4;i++) {
            $(`.orange-points #orange${i}`).hide();
            $(`.blue-points #blue${i}`).hide();
        }
    });
});