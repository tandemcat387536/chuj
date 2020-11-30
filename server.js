
// SERVER CFG
const express = require('express');
const app = express();
app.use(express.static('public'));
//const http = require('http').Server(app);
const server = app.listen(3000);
const io = require('socket.io')(server);
const Datastore = require('nedb');

console.log("My socket server is running");

const users = new Datastore('users.db');
users.loadDatabase();
const points_database = new Datastore('points_database.db');
points_database.loadDatabase();


function generateCards() {
    let suits = ["hearts", "diamonds", "spades", "clubs"];
    let values = [7, 8, 9, 10, 11, 12, 13, 14];
    let cards = [];
    for (let suit of suits) {
        for (let value of values) {
            let card = {
                suit: suit,
                value: value
            };
            cards.push(card);
        }
    }
    return cards;
}


// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

let actualPlayer;
let nextBeginningPlayerID = null;
let players = [];
let playerNames = {};
let cards = generateCards();
let player_points = {};
let player_overall_points = {};
shuffle(cards);
let readyPlayers = 0;
let newGamePlayers = 0;

io.sockets.on('connection', (socket) => {

    socket.on('playerCreated', (player_name) => {
        console.log('new player created: ' + socket.id);

        if (players.length < 4) {
            players.push(socket.id);
            player_overall_points[socket.id] = {playerName: player_name, playerPoints: 0};
            playerNames[players.length - 1] = player_overall_points[socket.id].playerName;
            if (players.length === 4) {
                console.log("4 players connected");
                actualPlayer = 0;

                for (let i = 0; i < 4; i++) {
                    io.to(players[i]).emit('startingGame', cards.slice(i * 8, i * 8 + 8), i, playerNames);
                }

                nextBeginningPlayerID = players[1];
                io.to(players[0]).emit('yourTurn');
                console.log("Player is on turn : " + players[0]);
            }
        } else {
            console.log("Full capacity, gtfo : " + socket.id);
        }
    });

    socket.on('myTurn', () => {
        for (let key in playerNames) {
            if (player_overall_points[socket.id].playerName === playerNames[key]) {
                io.emit('IndexOfPlayerOnTurn', key);
            }
        }
    });

    socket.on('flushDeck', () => {
        socket.broadcast.emit('flushDeck');
    });

    socket.on('moveDone', function (data) {
        socket.broadcast.emit('newCardPlayed', data);

        actualPlayer++;
        if (actualPlayer < 4) {
            io.to(players[actualPlayer]).emit('yourTurn');
            console.log("Player is on turn : " + players[actualPlayer]);
        }
    });

    socket.on('fullDeck', (beginningPlayerID) => {
        console.log("beginningPlayerID : " + beginningPlayerID);
        io.to(beginningPlayerID).emit('takeDeck');
        updateOrderOfPlayers(players, beginningPlayerID);
    });

    socket.on('endGame', () => {
       console.log("game over, " + socket.id + " everybody send points");
       io.emit("sendPoints");
    });

    socket.on('sendingPoints', function (data) {
        console.log(data.playerName + " is sending points");
        storePoints(data);
    });

    socket.on('playerReady', () => {
        readyPlayers++;
        if (readyPlayers === 4) {
            newGame();
        }
    });

    socket.on('subtract', () => {
        player_overall_points[socket.id].playerPoints -= 40;
        if (player_overall_points[socket.id].playerPoints < 0) {
            player_overall_points[socket.id].playerPoints = 0;
        }
        io.emit('gameOver', player_points, player_overall_points, false, false);
    });

    socket.on('add', () => {
        for (let key in player_overall_points) {
            if (key !== socket.id) {
                player_overall_points[key].playerPoints += 20;
            } else {
                player_overall_points[key].playerPoints -= 20;
            }
        }
        let lost = checkPoints();
        io.emit('gameOver', player_points, player_overall_points, lost, false);
    });

    socket.on('newGame', () => {
        newGamePlayers++;
        if (newGamePlayers === 4) {
            for (let key in player_overall_points) {
                delete player_overall_points[key];
            }

            for (let key in player_points) {
                delete player_points[key];
            }
            newGame();
        }
    });

    socket.on('disconnect', () => {
        let p = players.indexOf(socket.id);
        if (p !== -1) {
            playerWhoPlayedDisconnects(p);
        }
    });

    // returns true if player has lost, false otherwise
    function checkPoints() {
        for (let key in player_overall_points) {
            if (player_overall_points[key].playerPoints === 100) {
                player_overall_points[key].playerPoints -= 20;
                if (player_overall_points[key].playerPoints < 0) {
                    player_overall_points[key].playerPoints = 0;
                }
            } else if (player_overall_points[key].playerPoints > 100) {
                return key;
            }
        }
        return false;
    }

    function playerWhoPlayedDisconnects(playerIndex) {
        console.log("player disconnected : " + players[playerIndex]);
        for (let key in player_points) {
            delete player_points[key];  //player_points.key
        }

        let disconnecting;
        for (let key in playerNames) {
             if (playerNames[key] === player_overall_points[players[playerIndex]].playerName) {
                disconnecting = key;
            }
        }

        delete player_overall_points[players[playerIndex]];
        io.emit('cancellingGame');
        actualPlayer = 0;
        nextBeginningPlayerID = null;
        cards = generateCards();
        shuffle(cards);
        readyPlayers = 0;
        delete playerNames[disconnecting];
        players.splice(playerIndex, 1);
    }

    function storePoints(data) {
        player_points[data.playerID] = {playerName: data.playerName, playerPoints: data.playerPoints};
        console.log(player_overall_points);
        player_overall_points[data.playerID].playerPoints = player_overall_points[data.playerID].playerPoints + data.playerPoints;

        let twenty = false;
        console.log(player_points);
        if (Object.keys(player_points).length === 4) {
            points_database.insert(player_points);
            for (let key in player_points) {

                console.log("Player : " + key + " points : " + player_points[key].playerPoints);
                if (player_points[key].playerPoints === 20) {
                    io.to(key).emit('choosePoints');
                    twenty = true;
                }
            }
            if (!twenty) {
                let lost = checkPoints();
                if (lost === false) {
                    io.emit('gameOver', player_points, player_overall_points, lost, true);
                } else {
                    io.emit('gameOver', player_points, player_overall_points, player_overall_points[lost].playerName, true);
                }
            }

            for (let key in player_points) {
                delete player_points[key];
            }
        }
    }

    function updateOrderOfPlayers(players, beginningPlayerID) {
        let first = players[0];
        while (first !== beginningPlayerID) {
            players.push(players.shift());
            first = players[0];
        }
        actualPlayer = 0;
    }

    function newGame() {
        readyPlayers = 0;
        actualPlayer = 0;
        while (players[0] !== nextBeginningPlayerID) {
            players.push(players.shift());
        }
        nextBeginningPlayerID = players[1];
        cards = generateCards();
        shuffle(cards);
        for (let i = 0; i < 4; i++) {
            io.to(players[i]).emit('startingGame', cards.slice(i * 8, i * 8 + 8), i, playerNames);
        }
        io.to(players[actualPlayer]).emit('yourTurn');
        console.log("Player is on turn : " + players[actualPlayer]);
    }
});

