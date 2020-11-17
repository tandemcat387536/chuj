
// SERVER CFG
const express = require('express');
const app = express();
const server = app.listen(3000);
const io = require('socket.io')(server);
app.use(express.static('public'));
/*
app.get('/', (req, res) => {
    res.send("Hello world|")
});
*/
console.log("My socket server is running");

let actualPlayer;
let gameStarted = false;

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

function results(players) {
    for (let player of players) {
        console.log(player.points);
    }
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

const players = [];
const cards = generateCards();
const player_points = {};
shuffle(cards);

io.sockets.on('connection', (socket) => {

    socket.on('playerCreated', () => {
        console.log('new player created: ' + socket.id);

        if (players.length < 4) {
            players.push(socket.id);
            if (players.length === 4) {
                console.log("4 players connected");
                gameStarted = true;
                actualPlayer = 0;

                for (let i = 0; i < 4; i++) {
                    io.to(players[i]).emit('startingGame', cards.slice(i * 8, i * 8 + 8), i);
                }

                io.to(players[actualPlayer]).emit('yourTurn');
                console.log("Player is on turn : " + players[actualPlayer]);
            }
        } else {
            console.log("Full capacity, gtfo");
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
        console.log("beginningPlayerID" + beginningPlayerID);
        io.to(beginningPlayerID).emit('takeDeck');
        updateOrderOfPlayers(players, beginningPlayerID);
    });

    socket.on('gameOver', () => {
       console.log("game over");
       io.emit("sendPoints");
    });

    socket.on('sendingPoints', function (data) {
        player_points[data.playerID] = data.playerPoints;
        if (Object.keys(player_points).length === 4) {
            for (let key in player_points) {
                console.log("Player : " + key + " points : " + player_points[key])
            }
        }
    });

    socket.on('disconnect', () => {
        for (let p = 0; p < players.length; p++) {
            if (players[p] === socket.id) {
                console.log("player disconnected : " + players[p]);
                players.splice(p, 1);
            }
        }
    });


    function updateOrderOfPlayers(players, beginningPlayerID) {
        let first = players[0];
        while (first !== beginningPlayerID) {
            players.push(players.shift());
            first = players[0];
        }
        actualPlayer = 0;
    }
});

