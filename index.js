const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const wsRooms = [];
const wsClients = [];

//funkcija za ciscenje ws konekcija koje nemaju sobu
setTimeout(() => {
  for( let i = 0; i < wsClients.length; i++){
   if (wsClients[i].room_number === undefined) {
     wsClients[i].terminate();
     wsClients.splice(i, 1);
     console.log("terminated ws");
   }
 }
}, 10000);


wss.on('connection', function connection(ws) {
  wsClients.push(ws);
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    message = JSON.parse(message);
    if(message.type === 'join-room'){
      try{
        if(isNaturalNumber(message.room_number)){
          if(wsRooms[message.room_number - 1].player1 !== undefined && wsRooms[message.room_number - 1].player2 === undefined ){
            wsRooms[message.room_number - 1].player2 = ws;
            ws.room_number = message.room_number;
            startGame(message.room_number - 1);
          }
          else{
            console.log("Undefined room - wrong room number")
          }
        }
        else{
          console.log("You didnt send a natural number as a room number")
        }
      }
      catch(err){
        console.error(err.message);
      }
    }


    if(message.type === 'create-room'){
      try{
        wsRooms.push({
          player1: ws,
          player2: undefined,
        });
        ws.room_number = message.room_number;
        ws.username = message.username;
        ws.score = message.score;
        console.log("room_number:" + message.room_number);
        console.log("Dal se primilo u ws objekt:" + ws.room_number);
        console.log('kreirana soba' + ws.room_number);
      }
      catch(err){
        console.error(err.message);
      }
    }

    if(message.type === 'delete-room'){
      try{
        if(isNaturalNumber(message.room_number)){
          if(wsRooms[message.room_number - 1] !== undefined){
            removeFromArray(wsRooms, message.room_number - 1, ws)
          }
          else{
            console.log("Undefined room - wrong room number")
          }
        }
        else{
          console.log("You didnt send a natural number as a room number")
        }
      }
      catch(err){
        console.error(err.message);
      }
    }

  });


  ws.on('close', function incoming(message) {
    console.log('Disconnected');
    wsRooms.pop();

  });
  ws.send('Connected as client ' + wsRooms.length);
});

function isNaturalNumber(number){
  let stringNumber = String(number);
  if(/^[0-9]{1,}$/.test(stringNumber)){
    return true;
  }
  else{
    return false;
  }
}

function removeFromArray(array, index, ws){
    ws.room_number = undefined;
    array.splice(index, 1);
    console.log(array);
}

async function startGame(room_number){
  let gameObject={
    player1: {
      name: wsRooms[room_number].player1.username,
      score:wsRooms[room_number].player1.score,
    },
    player2: {
      name:wsRooms[room_number].player2.username,
      score:wsRooms[room_number].player2.score,
    },
    level: 1,
    word: "",
    word_hint: "",
    active_player: 1,
  };
  jsonGameObject = JSON.stringify(gameObject);
  wsRooms[room_number].player1.send(jsonGameObject);
  wsRooms[room_number].player2.send(jsonGameObject);
  console.log("Sent messages");
}

function endGame(room_number){
  wsRooms[room_number].player1.terminate();
  wsRooms[room_number].player2.terminate();
}
