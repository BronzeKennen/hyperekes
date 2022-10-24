function getValue(i){
    var value= $.ajax({ 
        url: 'https://cwxskbsjnovkyqeloumw.supabase.co/rest/v1/rpc/' + functions[i]['function'],
        async: false,
        headers: {'Content-Type': 'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E'}
    }).responseText;

    return JSON.parse(value);
}

function getTeams(){
    var value= $.ajax({ 
        url: 'https://cwxskbsjnovkyqeloumw.supabase.co/rest/v1/rpc/getteams',
        async: false,
        headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eHNrYnNqbm92a3lxZWxvdW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjMyNDgzODYsImV4cCI6MTk3ODgyNDM4Nn0.NtKg2p6BHRBbpm4FM0cAGA5lWWGkjWyt-oyvsQfZI_E'}
    }).responseText;

    return JSON.parse(value);
}

functions = [
    {name: "goal", stat: 'goals', function: 'goalleaderboards'},
    {name: "shot", stat: 'shots', function: 'shotleaderboards'},
    {name: "assist", stat: 'assists', function: 'assistleaderboards'},
    {name: "save", stat: 'saves', function: 'saveleaderboards'},
    {name: "mvp", stat: 'mvp', function: 'mvpleaderboards'},
    {name: "Shot%", stat: 'shooting_percentage', function: 'shootingpercentageleaderboards'},
    {name: "Standings", stat: 'Standings', function: 'getteams'}
];

$(document).ready(async () => {
    time = 0;
    i=0;
    while (i < 24) {
        $(".stats .goals").hide();
        $(".stats .shots").hide();
        $(".stats .assists").hide();
        $(".stats .saves").hide();
        $(".stats .mvp").hide();
        $(".stats .shooting_percentage").hide();
        $(".stats .Standings").hide();
        imod = i % 6;
        // loopPls(imod);
        let loopPls = new Promise((resolve,reject) => {
            j=1;
            teams = getTeams();
            if (i <= 5){
                var stats = getValue(i);
                $(".stats ." + functions[i]['stat']).show();
                console.log('we are now doing ' + functions[i]['name']);
                $(".leaderboards").text(functions[i]['name'].toUpperCase());
                $(".stats ." + functions[i]['stat'] + " .headers #stat").text(functions[i]['name'].toUpperCase());
                for (player in stats) {
                    $(".stats ." + functions[i]['stat'] + " .p" + String(j) + " #name").text(stats[player]['name'].toUpperCase());
                    $(".stats ." + functions[i]['stat'] + " .p" + String(j) + " #stat").text(stats[player][functions[i]['stat']]);
                    for (y in teams) {
                        if (stats[player]['team'].toUpperCase() == teams[y]['name'].toUpperCase()){
                            $(".stats .p" + String(j) + " #logo").attr("src", teams[y]['logo']);
                        }
                    }
                    j++;
                }
                $("#background").attr("src", "LEADERBOARD_empty_10.png");
            } else {
                $("#background").attr("src", "LEADERBOARD_empty_8.png");
                $(".stats ." + functions[i]['stat']).show();
                console.log('we are now doing ' + functions[i]['name']);
                $(".leaderboards").text(functions[i]['name'].toUpperCase());
                $(".stats ." + functions[i]['stat'] + " .headers #stat").text(functions[i]['name'].toUpperCase());
                for(team in teams) {
                    $(".stats ." + functions[i]['stat'] + " .p" + String(j) + " #name").text(teams[team]['name'].toUpperCase());
                    $(".stats ." + functions[i]['stat'] + " .p" + String(j) + " #stat").text((teams[team]['wins'] +'-'+ teams[team]['losses']).toUpperCase());
                    $(".stats ." + functions[i]['stat'] + " .p" + String(j) + " #logo").attr("src", teams[team]['logo']);
                    j++;
                }
                i = 0;
            }
            setTimeout(() => resolve("..."),14800);
        })
        await loopPls.then(() => {
            $(".stats ." + functions[i]['stat']).hide();
        })
        console.log(i);
        i++;
    }
})


    //$("#leaderboards").fadeOut(2000);
    //$(".stats").fadeOut(2000);
    
    // time += 15000;


