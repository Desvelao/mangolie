(function(){
  //query selector jQuery;
  var $ = function (selector) {
    return document.querySelector(selector);
  };
  var config = {
    apiKey: "AIzaSyD6R4IbPsLKFu4HOOCDpx-Rgr22Yi8_H9U",
    authDomain: "mango-bot.firebaseapp.com",
    databaseURL: "https://mango-bot.firebaseio.com",
    projectId: "mango-bot",
    storageBucket: "mango-bot.appspot.com",
    messagingSenderId: "800415784416"
  };
  var webLogin = {email : 'public@mango.io', password : 'public'};
  firebase.initializeApp(config);
  const db = {db : firebase.database().ref(), profiles : firebase.database().ref().child('profiles'), lie : firebase.database().ref().child('lie'), matches : firebase.database().ref().child('lie').child('matches'), feed : firebase.database().ref().child('lie').child('feed')};
  const storage = {lie : firebase.storage().ref('lie')};
  const emojis = {match : {add : "✅",delete : "❌", switch : "🔁"}, upload : "⬆"}
  //console.log('Hola');
  const rewardPoints = {match_played : 1, match_wins : 2};
  function init(){
    for (var i = 0; i < 5; i++) {
      let row_radiant = $("#radiant").insertRow(i+1);
      let row_dire = $("#dire").insertRow(i+1);
      row_radiant.insertCell(0);
      row_dire.insertCell(0);
    }
    firebase.auth().signInWithEmailAndPassword(webLogin.email,webLogin.password).then(()=> {
      ranking()
    })
  }

  function playerPoints(player){
    return player.lie.games * rewardPoints.match_played + player.lie.wins * rewardPoints.match_wins
  }
  function playerWR(player){
    return ((player.lie.wins/player.lie.games)*100).toFixed(2)
  }
  function ranking(){
    const table = $("#ranking-tabla").childNodes[1];
    deleteChildNodesSaveFirst(table);
    db.profiles.once('value').then((snap) => {
      if(!snap.exists()){return};
      snap = snap.val();
      var array = Object.keys(snap).map((k) => {el = snap[k]; el.lie.points = playerPoints(el); el.lie.wr = playerWR(el); el.discord_id = k; return el}).filter((el) => {if(el.lie && el.lie.games > 0){return true}else{return false}});
      array.sort(function(a,b){
        // let mmr = b.lie.mmr - a.lie.mmr;
        // if(mmr !== 0){return mmr};
        let points = b.lie.points - a.lie.points;
        if(points !== 0){return points};
        let winrate = b.lie.wr - a.lie.wr;
        if(winrate !== 0){return winrate};
        let user1 = a.username.toLowerCase(), user2 = b.username.toLowerCase();
        if(user1 < user2){return -1};
        if(user1 > user2){return 1};
      return 0});
      for (var i=0; i < array.length; i++){
        let data = array[i];
        const row = table.insertRow(i+1);
        row.insertCell(0).innerText = '#' + (i+1);
        let player = row.insertCell(1);
        player.innerHTML = `<div class="d-flex align-items-center puntero"><img class="mr-2" src="${data.avatar}" alt="avatar"><span>${data.username}</span></div>`
        player.className = "text-left";
        //player.getElementsByTagName('a')[0].onclick = player_click2;
        player.onclick = player_click;
        player.value = data.discord_id;
        // row.insertCell(2).innerText = data.username;
        // row.insertCell(2).innerText = data.lie.mmr;
        row.insertCell(2).innerText = data.lie.games;
        row.insertCell(3).innerText = data.lie.wins;
        row.insertCell(4).innerText = data.lie.points;
      }
    })
  }

  function player_show(player_id){
    const table = $("#menu-player-table").childNodes[1];
    deleteChildNodesSaveFirst(table);
    player_id = player_id.toString();
    $('#menu-player-info').classList.remove('hide');
    $("#menu-player-no-matches").classList.add('hide');
    $("#menu-player-table").classList.remove('hide');
    db.profiles.once('value').then((snap) => {
      if(!snap.exists()){return};
      snap = snap.val();
      //console.log(`player id: ${player_id}`);
      const player = getPlayerFromID(player_id,snap);
      // console.log(player);
      $('#menu-player-img').src = player.avatar;
      $('#menu-player-username').innerText = player.username;
      $('#menu-player-stats-games').innerText = player.lie.wins + "(" + player.lie.games + ")";
      $('#menu-player-stats-points').innerText = playerPoints(player);
      //const matches_id = player.lie.matches.split(',');
      db.matches.once('value').then((shot) => {
        if(!shot.exists()){
          $("#menu-player-table").classList.add('hide');
          $("#menu-player-no-matches").classList.remove('hide');
          return};
        // $('#menu-player-stats-wins').innerText = player.lie.wins;
        var liematches = shot.val();
        var player_matches = Object.keys(liematches).map((m) => {var match = liematches[m]; match.id = m; return match}).filter((m) => {
          let radiant_play = m.radiant.split(',').find(p => p === player_id);
          let dire_play = m.dire.split(',').find(p => p === player_id);
          if(radiant_play || dire_play){return true}else{return false};
        });
        //console.log(player_matches);
        if(player_matches.length > 0){
          player_matches = player_matches.sort(function(a,b){return b.ts - a.ts})
          for (var i = 0; i < player_matches.length; i++) {
            var match = player_matches[i];
            const row = table.insertRow(table.rows.length);
            // let player = row.insertCell(1);
            // player.innerHTML = `<div href="${data.lie.id}"><span class"avatar_center"></span><img src="${data.avatar}" alt="avatar">${data.username}</div>`
            // player.className = "text-left";
            // //player.getElementsByTagName('a')[0].onclick = player_click2;
            // player.onclick = player_click;
            var matchCell = row.insertCell(0)
            matchCell.innerHTML = `<div class="puntero">${match.id}</div>`;
            matchCell.value = match.id
            matchCell.onclick = match_click;
            let radiant_play = match.radiant.split(',').find(p => p === player_id);
            let dire_play = match.dire.split(',').find(p => p === player_id);
            //console.log(match.id,'rd',radiant_play,dire_play,match.radiant_wins);
            if((radiant_play && match.radiant_wins) || (dire_play && !match.radiant_wins)){
              row.insertCell(1).innerText = 'W';
            }else{
              row.insertCell(1).innerText = 'L';
            }
            row.insertCell(2).innerText = date(match.ts);
            storage.lie.child(match.id+'.jpg').getDownloadURL().then(function(url){
              row.insertCell(3).innerHTML = `<a href="${url}" target="_blank"><i class="fa fa-file-image-o mr-3"></i></a>`}).catch((error) => {row.insertCell(3).innerText = ''})
          }
        }else{
          $("#menu-player-table").classList.add('hide');
          $("#menu-player-no-matches").classList.remove('hide');
        }
        showComponent('player');
        // $("#menu-player-info").classList.remove('hide');
      })
    })
  }

  function date(seconds){
    let date = new Date(seconds*1000);
    function zero(text,digits){
      digits = digits || 2;
      text = text.toString();
      if(digits > text.length){
        text = "0".repeat(digits-text.length) + text
      }
      return text
    }
    return zero(date.getHours()) + ':' + zero(date.getMinutes()) + ':' + zero(date.getSeconds()) + ' ' + zero(date.getDate()) + '/' + zero((date.getMonth()+1)) + '/' + date.getFullYear()
  }

  function getPlayerFromID(id,snap){
    //console.log(id,snap);
    var player = Object.keys(snap).map((k) => {var p = snap[k]; p.discord_id = k; return p}).find((p) => {return p.discord_id == id});
    //console.log(player);
    return player ? player : {username: "Desconocid@", lie : {games : 0, wins : 0}, avatar : 'avatar'}
  }

  function player_click(){
    var id = this.value;
    playerReset(function(){player_show(id);})
    return false
  }

  function match_click(){
    var id = this.value;
    matchReset(function(){match_show(id);})
    return false
  }

  $('#addmatch-upload').addEventListener('change',function(){
    let label = $('#addmatch-upload-label');
    var pic = $('#addmatch-upload').files;
    if(pic.length < 1){return};
    label.innerHTML = '<i class="fa fa-file-image-o white mr-3"></i>' + pic[0].name;
  })

  $('#menu-match-select').addEventListener('change',function(){
    var lista = $("#menu-match-select");
    var opcion = lista.selectedIndex;
    if(opcion === 0){return};
    //alert("Elegiste la opcion con indice: " + opcion + "la cual contiene el valor: " + lista.options[opcion].firstChild.data);
    $('#match-info').classList.remove('hide');
    var match_id = lista.options[opcion].firstChild.data;
    match_show(match_id);
  })

  function match_show(match_id){
    // $('#match-info').classList.remove('hide');
    db.matches.child(match_id).once('value').then((snap) => {
      if(!snap.exists()){return};
      snap = snap.val();
      $('#match_id').innerText = 'ID Partida: ' + match_id;
      var winner = snap.radiant_wins ? 'Radiant' : 'Dire'
      $('#match_wins').innerText = 'Ganador: ' + winner;
      $('#match_date').innerText = date(snap.ts);
      $('#match-info').setAttribute('match_id', match_id);
      $('#match-info').setAttribute('radiant_wins', snap.radiant_wins);
      db.profiles.once('value').then((shot) => {
        shot = shot.val();
        var teams = {radiant : snap.radiant.split(",").map((id) => getPlayerFromID(id,shot)),dire : snap.dire.split(",").map((id) => getPlayerFromID(id,shot))}
        var radiant = $('#radiant');
        for (var i = 0; i < teams.radiant.length; i++) {
          let data = teams.radiant[i];
          radiant.rows[i+1].innerHTML = `<td class="text-left"><div class="d-flex align-items-center puntero"><img class="mr-3" src="${data.avatar}" alt="avatar"><span>${data.username}</span></div></td>`
          radiant.rows[i+1].className = "text-left";
          radiant.rows[i+1].onclick = player_click;
          radiant.rows[i+1].value = data.discord_id;
        }
        var dire = $('#dire');
        for (var i = 0; i < teams.radiant.length; i++) {
          let data = teams.dire[i];
          dire.rows[i+1].innerHTML = `<td class="text-left"><div class="d-flex align-items-center puntero"><img class="mr-3" src="${data.avatar}" alt="avatar"><span>${data.username}</span></div></td>`
          dire.rows[i+1].onclick = player_click;
          dire.rows[i+1].value = data.discord_id;
        }
        firebase.storage().ref('lie/'+match_id+'.jpg').getDownloadURL().then(function(url){
          if(url){$('#match_img').innerHTML = `<a class="fa fa-file-image-o white text-deco-none" href="${url}" target= "_blank"></a>`}
        }).catch(e => {$('#match_img').innerHTML = ''})
        let user = firebase.auth().currentUser;
        if(user && user.email !== webLogin.email){ // && user.email !== webLogin.email
          // console.log(user);
          $("#match-info-admin").classList.remove('hide');
        }else{
          $("#match-info-admin").classList.add('hide');
        }
        showComponent('match');
        $("#match-info").classList.remove('hide');
      })
    })
  }

  function showComponent(component){
    $('#menu-ranking').classList.add('hide');
    $('#btn-menu-ranking').getElementsByTagName("I")[0].classList.remove('btn-selected');
    $('#menu-player').classList.add('hide');
    $('#btn-menu-player').getElementsByTagName("I")[0].classList.remove('btn-selected');
    $('#menu-match').classList.add('hide');
    $('#btn-menu-match').getElementsByTagName("I")[0].classList.remove('btn-selected');
    $('#menu-login').classList.add('hide');
    $('#btn-menu-login').getElementsByTagName("I")[0].classList.remove('btn-selected');
    $('#btn-menu-admin').getElementsByTagName("I")[0].classList.remove('btn-selected');
    $('#menu-feed').classList.add('hide');
    $('#btn-menu-feed').getElementsByTagName("I")[0].classList.remove('btn-selected');
    if(component !== 'admin'){
      $('#menu-'+component).classList.remove('hide');
    }else{
      $('#menu-login').classList.remove('hide');
      if(component === 'login'){$('#btn-menu-'+component).getElementsByTagName("I")[0].classList.remove('hide');}
    }
    $('#btn-menu-'+component).getElementsByTagName("I")[0].classList.add('btn-selected');
  }

  $('#btn-menu-ranking').addEventListener('click',function(){
    ranking();
    showComponent('ranking');
  })

  $('#btn-menu-match').addEventListener('click',function(){
    matchReset();
    showComponent('match');
  })

  $('#match-info-admin-delete').addEventListener('click',function(){
    let match_id = $('#match-info').getAttribute('match_id');
    if(!match_id){return};
    let info = getInfoFromMatchWeb();
    // console.log(info);
    db.profiles.once('value').then((snap) => {
      snap = snap.val();
      // console.log('RADIANT');
      info.radiant.forEach((player) => {
        let dbplayer = snap[player].lie
        let victory = info.radiant_wins ? dbplayer.wins - 1 : dbplayer.wins;
        console.log(`Delete stats from ${player}`,dbplayer.wins, victory);
        db.profiles.child(player+'/lie').update({games : dbplayer.games - 1, wins : victory})
      });
      // console.log('DIRE');
      info.dire.forEach((player) => {
        let dbplayer = snap[player].lie
        let victory = !info.radiant_wins ? dbplayer.wins - 1 : dbplayer.wins;
        console.log(`Delete stats from ${player}`,dbplayer.wins, victory);
        db.profiles.child(player+'/lie').update({games : dbplayer.games - 1, wins : victory})
      })
      db.matches.child(info.match_id).remove();
      addFeed('deletematch',match_id);
      feed_show();
      $('#match-info').classList.add('hide');
    });
  })
  $('#match-info-admin-switch-winner').addEventListener('click',function(){
    let match_id = $('#match-info').getAttribute('match_id');
    if(!match_id){return};
    let info = getInfoFromMatchWeb();
    console.log(info);
    // console.log(info);
    db.profiles.once('value').then((snap) => {
      snap = snap.val();
      // console.log('RADIANT');
      info.radiant.forEach((player) => {
        let dbplayer = snap[player].lie
        let victory = !info.radiant_wins ? dbplayer.wins + 1 : dbplayer.wins - 1;
        // console.log(`Switch team victory from ${player}`,dbplayer.wins, victory);
        db.profiles.child(player+'/lie').update({wins : victory})
      });
      // console.log('DIRE');
      info.dire.forEach((player) => {
        let dbplayer = snap[player].lie
        let victory = info.radiant_wins ? dbplayer.wins + 1 : dbplayer.wins - 1;
        // console.log(`Switch team victory from ${player}`,dbplayer.wins, victory);
        db.profiles.child(player+'/lie').update({wins : victory})
      })
      console.log(match_id,info.radiant_wins,!info.radiant_wins);
      db.matches.child(match_id).update({radiant_wins : !info.radiant_wins}).then(() => console.log('changed match'));
      // db.matches.child(info.match_id).remove();
      addFeed('switchmatch',match_id);
      match_show(match_id);
    });
  })

  function getInfoFromMatchWeb(){
    let match_id = $('#match-info').getAttribute('match_id');
    if(!match_id){return};
    let radiant_wins = ($('#match-info').getAttribute('radiant_wins') == 'true');
    let info = {radiant : [], dire : [], match_id : match_id, radiant_wins : radiant_wins}
    // console.log(match_id,radiant_wins);
    var radiant = $('#radiant'),dire = $('#dire');
    // console.log(radiant.rows.length,dire.rows.length);
    for (var i = 1; i < radiant.rows.length; i++) {
      // console.log(radiant.rows[i].value);
      info.radiant.push(radiant.rows[i].value)
    }
    for (var i = 1; i < dire.rows.length; i++) {
      info.dire.push(dire.rows[i].value)
    }
    return info
    // console.log(info);
  }
  function playerReset(callback){
    deleteChildNodesSaveFirst($("#menu-player-select"));
    db.profiles.once('value').then((snap) => {
      if(!snap.exists()){return};
      snap = snap.val();
      var array = Object.keys(snap).map((k) => {el = snap[k]; el.discord_id = k; return el}).filter((el) => el.lie);
      //console.log(array);
      array.sort(function(a,b){
        let user1 = a.username.toLowerCase(), user2 = b.username.toLowerCase();
        if(user1 < user2){return -1};
        if(user1 > user2){return 1};
        return 0});
      let select = $("#menu-player-select");
      selectPlayer(array,select);
      callback();
    })
  };

  function matchReset(callback){
    deleteChildNodesSaveFirst($("#menu-match-select"));
    db.matches.once('value').then((snap) => {
      snap = snap.val();
      var array = Object.keys(snap).map((k) => {el = snap[k]; el.match_id = k; return el});
      array.sort(function(a,b){return b.ts-a.ts});
      const select = $("#menu-match-select");
      for (var i = 0; i < array.length; i++){
        let option = document.createElement('option');
        option.innerText = array[i].match_id;
        select.appendChild(option);
      };
      if(callback){callback()};
    })
  };

  $('#btn-menu-player').addEventListener('click',function(){
    playerReset(function(){showComponent('player')})
  })

  $('#btn-menu-login').addEventListener('click',function(){
    showComponent('login')
  })

  $('#btn-menu-admin').addEventListener('click',function(){
    showComponent('admin')
  })

  function selectPlayer(array,select){
    for (var i=0; i < array.length; i++){
      let option = document.createElement('option');
      option.innerText = array[i].username;
      option.value = array[i].discord_id;
      select.appendChild(option);
    }
  }

  $('#menu-player-select').addEventListener('change',function(){
    var lista = $('#menu-player-select');
    var opcion = lista.selectedIndex;
    // console.log(opcion);
    if(opcion === 0){return};
    //alert("Elegiste la opcion con indice: " + opcion + "la cual contiene el valor: " + lista.options[opcion].firstChild.data);
    $('#match-info').classList.remove('hide');
    player_show(lista.options[opcion].value);
  })

  $('#btn-login').addEventListener('click',function(){
    let email = $('#login-email').value;
    let password = $('#login-password').value;
    firebase.auth().signInWithEmailAndPassword(email,password).then(() => {
      db.profiles.once('value').then((snap) => {
        if(!snap.exists()){return};
        $('#menu-login-addmatch').classList.remove('hide');
        $('#btn-menu-login').classList.add('hide');
        $('#menu-login-form').classList.add('hide');
        $('#login-alert').classList.add('hide');
        $('#btn-menu-admin').classList.remove('hide');
        $('#btn-menu-admin').getElementsByTagName("I")[0].classList.add('btn-selected');
        $('#btn-menu-feed').classList.remove('hide');
        $('#btn-menu-signout').classList.remove('hide');
        snap = snap.val();
        var array = Object.keys(snap).map((k) => {el = snap[k]; el.discord_id = k; return el}).filter((el) => el.lie);
        array.sort(function(a,b){
          let games = b.lie.games - a.lie.games;
          if(games !== 0){return games};
          let user1 = a.username.toLowerCase(), user2 = b.username.toLowerCase();
          if(user1 < user2){return -1};
          if(user1 > user2){return 1};
        return 0});
        for (var i=0; i < 5; i++){
          let select = document.createElement("select");
          select.id = 'addmatch-player-'+(i+1);
          select.className = "custom-select";
          selectPlayer(array,select);
          $('#addmatch-radiant').appendChild(select);
        }
        for (var i=0; i < 5; i++){
          let select = document.createElement("select");
          select.id = 'addmatch-player-'+(i+6);
          select.className = "custom-select";
          selectPlayer(array,select);
          $('#addmatch-dire').appendChild(select);
        }
        $('#login-email').value = "";
        $('#login-password').value = "";
        feed_show();
        // showComponent('feed');
        //$('#menu-login-addmatch')
      })
    }).catch((error) => {
      $('#login-alert').classList.remove('hide');
      console.log(error)
    })
  });

  $('#login-email').addEventListener("keyup", event => {
    if(event.key !== "Enter"){return}; // Use `.key` instead.
    $("#btn-login").click(); // Things you want to do.
    event.preventDefault(); // No need to `return false;`.
  });

  $('#login-password').addEventListener("keyup", event => {
    if(event.key !== "Enter"){return}; // Use `.key` instead.
    $("#btn-login").click(); // Things you want to do.
    event.preventDefault(); // No need to `return false;`.
  });

  function deleteChildNodes(node){
    if (node.hasChildNodes()) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }
  }

  function deleteChildNodesSaveFirst(node){
    if (node.hasChildNodes()) {
      while (node.childNodes.length > 2) {
        node.removeChild(node.lastChild);
      }
    }
  }

  function deleteCurrentNode(node){
    node.parentNode.removeChild(node)
  }

  function resetForm(form){
    // clearing inputs
    var inputs = form.getElementsByTagName('input');
    for (var i = 0; i<inputs.length; i++) {
        switch (inputs[i].type) {
            // case 'hidden':
            case 'text':
                inputs[i].value = '';
                break;
            case 'radio':
            case 'checkbox':
                inputs[i].checked = false;
            case 'number':
                inputs[i].value = '';
            case 'number':
                inputs[i].value = null;
        }
    }

    // clearing selects
    var selects = form.getElementsByTagName('select');
    for (var i = 0; i<selects.length; i++)
        selects[i].selectedIndex = 0;

    // clearing textarea
    var text= form.getElementsByTagName('textarea');
    for (var i = 0; i<text.length; i++)
        text[i].innerHTML= '';

    return false;
  }

  $('#btn-menu-signout').addEventListener('click',function(){
    firebase.auth().signOut().then(() => {
      $('#menu-login-addmatch').classList.add('hide');
      $('#menu-login-form').classList.remove('hide');
      $('#btn-menu-signout').classList.add('hide');
      $('#btn-menu-feed').classList.add('hide');
      $('#btn-menu-admin').classList.add('hide');
      $('#btn-menu-login').classList.remove('hide');
      $('#addmatch-error-players').classList.add('hide');
      $('#addmatch-error-match_id').classList.add('hide');
      for (var i=0; i < 10; i++){
        let select = $('#addmatch-player-'+(i+1));
        deleteChildNodes(select);
        deleteCurrentNode(select)
      }
      firebase.auth().signInWithEmailAndPassword(webLogin.email,webLogin.password).then(() => {showComponent('login')});
    })
  })

  $('#menu-login-addmatch').addEventListener('submit',(event)=>{
    event.preventDefault();
    $('#addmatch-error-players').classList.add('hide');
    $('#addmatch-error-match_id').classList.add('hide');
    var players = [];
    for (var i = 0; i < 10; i++) {
      let select = $('#addmatch-player-'+(i+1));
      let opcion = select.selectedIndex;
      players[i] = select.value
    }
    if(players.some(function(item, idx){return players.indexOf(item) != idx})){
      $('#addmatch-error-players').classList.remove('hide');return;
    }
    let radiant_wins = document.getElementsByName('victory')[0].checked ? true : false;
    let match_id = $('#addmatch-match_id').value > 0 ? $('#addmatch-match_id').value : false;
    if(match_id  === false || match_id < 0){$('#addmatch-error-match_id').classList.remove('hide'); console.log('No se ha colocado un ID de partida');return;}
    var update = {};
    update[match_id] = {radiant: players.slice(0,5).join(','), dire: players.slice(5).join(','), radiant_wins : radiant_wins ,ts : Math.round(new Date()/1000)};
    db.matches.update(update);
    db.profiles.once('value').then((snap) => {
      snap = snap.val();
      for (var i = 0; i < players.length; i++) {
        let player = Object.keys(snap).map((k) => {el = snap[k]; el.discord_id = k; return el}).find(p => p.discord_id === players[i])
        db.profiles.child(player.discord_id+'/lie').update({games : player.lie.games + 1, wins : player.lie.wins + ((((i < 5) && radiant_wins) || ((i > 4) && !radiant_wins)) ? 1 : 0)})
      }
    })
    let pic = $('#addmatch-upload').files;
    if(pic.length > 0){
      let task = firebase.storage().ref('lie/'+match_id+'.jpg').put(pic[0]);
      task.on('state_changed',(snapshot) => {
        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        $('#addmatch-submit').value = `${emojis.upload} Subiendo (${progress.toFixed(2)}%)`
      },(error) => {console.log(error);},() => {
        matchSubmitCompleted(match_id)
      })
    }else{
      matchSubmitCompleted(match_id)
    }
  })

  function matchSubmitCompleted(match_id){
    addFeed('addmatch',match_id);
    $('#addmatch-submit').value = `${emojis.upload} Subida completada`;
    resetForm($('#menu-login-addmatch'));
    setTimeout(() => {$('#addmatch-submit').value = "✅ Subir"},5000)
  }

  function addFeed(modo,match_id){
    let now = Math.round((new Date().getTime())/1000);
    let adminName = getAdminName();
    if(!adminName){return};
    let update = {};
    if(modo !== 'text'){
      update[now.toString()] = `${modo};${match_id};${adminName}`
    }else{update[now.toString()] = `${modo};${match_id}`}
    db.lie.child('feed').update(update)
  }
  function getAdminName(){
    let user = firebase.auth().currentUser;
    if(user){ // && user.email !== webLogin.email
      let name = user.email.match(/(.*)@/g)
      // console.log('Name',name);
      if(name){return name[0].slice(0,-1)}else{return false}
    }else{
      return false
    }
  }
  function parseFeeds(text){
    let [modo,id,admin] = text.split(';');
    if(modo === 'addmatch'){
      return `${emojis.match.add} <strong>${id}</strong> - @<strong>${admin}</strong>`
    }else if(modo === 'deletematch'){
      return `${emojis.match.delete} <strong>${id}</strong> - @<strong>${admin}</strong>`
    }else if(modo === 'switchmatch'){
      return `${emojis.match.switch} <strong>${id}</strong> - @<strong>${admin}</strong>`
    }else if(modo === 'text'){
      return `${id}`
    }
  }
  function feed_show(){
    const table = $("#feed-tabla").childNodes[1];
    deleteChildNodesSaveFirst(table);
    db.feed.once('value').then((snap) => {
      if(!snap.exists()){return};
      snap = snap.val();
      var feeds = Object.keys(snap).map((k) => {return {ts : parseInt(k), text : snap[k]}});
      feeds.sort(function(a,b){return parseInt(b.ts) - parseInt(a.ts)});
      let counter = 1;
      feeds.forEach((feed) => {
        const row = table.insertRow(counter);
        row.insertCell(0).innerText = date(feed.ts);
        row.insertCell(1).innerHTML = parseFeeds(feed.text);
        // row.insertCell(1).classList.add('text-left')
        counter++
      })
      showComponent('feed')
    })
  }
  $('#btn-menu-feed').addEventListener('click',function(){
    feed_show();
  })
  init()
})()
/*
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
*/
