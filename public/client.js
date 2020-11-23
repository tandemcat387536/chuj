const socket = io.connect('http://localhost:3000'); // connect to server

// CLASSES
class Player {

    constructor() {
        this._id = null;
        this._cards = [];
        this._points = 0;
        this._onTurn = false;
        this._playingIndex = -1;
        this._name = null;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    nullParams () {
        this._cards = [];
        this._points = 0;
        this._onTurn = false;
    }

    get playingIndex() {
        return this._playingIndex;
    }

    set playingIndex(value) {
        this._playingIndex = value;
    }

    get onTurn() {
        return this._onTurn;
    }

    set onTurn(value) {
        this._onTurn = value;
    }

    set points(value) {
        this._points += value;
    }

    get points() {
        return this._points;
    }

    set id(value) {
        this._id = value;
    }

    get id() {
        return this._id;
    }

    get cards() {
        return this._cards;
    }

    addCard(card) {
        this._cards.push(card);
        this._cards.sort(cmpSuits);
        this._cards.sort(cmpValues);
    }

    takeCards(points) {
        this._points += points;
    }

    showCards() {
        for (let card of this._cards) {
            document.getElementById('0').appendChild(card.image);
        }
    }
}

class Card {
    constructor(suit, value) {
        this._suit = suit;
        this._value = value;
        this._points = 0;
        this._image = null;
        this._id = null;
        this._playable = true;

        if (this._suit === "hearts") {
            this._points = 1;
        } else if (this._suit === "spades" && this._value === 12) {
            this._points = 8;
        } else if (this._suit === "clubs" && this._value === 12) {
            this._points = 4;
        } else {
            this._points = 0;
        }
    }

    get playable() {
        return this._playable;
    }

    set playable(value) {
        this._playable = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    set image(value) {
        this._image = value;
    }

    get points() {
        return this._points;
    }

    get suit() {
        return this._suit;
    }

    get value() {
        return this._value;
    }

    get image() {
        return this._image;
    }
}

class Deck {
    constructor() {
        this._points = 0;
        this._cards = [];
        this._beginningPlayer_id = 0;
        this._highestCard = null;
    }

    nullParams () {
        this._points = 0;
        this._cards = [];
        this._beginningPlayer_id = null;
        this._highestCard = null;
    }

    get cards() {
        return this._cards;
    }

    get beginningPlayer_id() {
        return this._beginningPlayer_id;
    }

    get highestCard() {
        return this._highestCard;
    }

    get points() {
        return this._points;
    }

    addCard(card, player_id) {
        this._cards.push(card);
        this._points += card.points;
        if (this._highestCard === null || (card.suit === this._highestCard.suit && card.value > this._highestCard.value)) {
            this._highestCard = card;
            this._beginningPlayer_id = player_id;
        }
    }
}

// COMPARE FUNCTIONS
function cmpValues(first, second) {
    if (first.suit === second.suit) {
        if (first.value < second.value) {
            return -1;
        }
        return 1;
    }
    return 0;
}

function cmpSuits(first, second) {
    return first.suit.localeCompare(second.suit);
}

let player = new Player();
let players = [];
let deck = new Deck();
let playerOnTurn = -1;

const msg = document.getElementById('msgText');
const resultTable = document.getElementById('resultTable');
const overallTable = document.getElementById('overallTable');
const takeButton = document.getElementById('takeDeck');
const readyButton = document.getElementById('ready');
const yourTurn = document.getElementById('yourTurn');
const nameButton = document.getElementById('nameButton');
const name = document.getElementById('name');
const nameLabel = document.getElementById('nameLabel');
const playerLeft = document.getElementById('playerLeft');
const playerRight = document.getElementById('playerRight');
const playerUp = document.getElementById('playerUp');
const myName = document.getElementById('myName');
let welcomeMsg = document.createElement("h2");

function playerName(e) {
    e.preventDefault();
    if (name.value === "") {
        alert("Please fill out your name");
    } else {
        nameLabel.style.display = "none";
        nameButton.style.display = "none";
        name.style.display = "none";

        msg.style.left = "20%";
        msg.innerHTML = "Vitaj chuju " + name.value + ", pockaj na ostatnych chuju";
        //welcomeMsg.innerHTML = "Welcome " + name.value;
        document.body.appendChild(welcomeMsg);
        player.name = name.value;
        socket.emit('playerCreated', player.name);
    }
}

function showCardsOfOtherPlayers() {
    for (let i = 0; i < 24; i++) {
        let img = document.createElement("img");
        img.classList.add("otherPlayerCard");
        img.src = "cards/back.png";
        img.id = "cardsBack" + Math.floor( i % 8);
        document.getElementById(Math.floor( i / 8) + 1).appendChild(img);
    }
}

function checkDeck() {
    if (deck.cards.length === 4) {
        ////console.log("Highest card :" + deck.highestCard.id + " beginningPlayerID :" + deck.beginningPlayer_id);
        socket.emit('fullDeck', deck.beginningPlayer_id);
    }
}

function flushDeck() {
    const nodeDeck = document.getElementById('deck');
    while (nodeDeck.firstChild) {
        nodeDeck.removeChild(nodeDeck.lastChild);
    }
    deck.nullParams();
}

function playableCards() {
    let hasSuit = false;
    for (let card of player.cards) {
        if (deck.cards.length !== 0) {
            if (card.suit === deck.cards[0].suit) {
                card.playable = true;
                card.image.classList.replace('imgNotPlayable', 'imgHand');
                hasSuit = true;
            } else {
                card.playable = false;
                card.image.classList.replace('imgHand', 'imgNotPlayable');
            }
        }
        ////console.log("Card : " + card.id + " playable : " + card.playable);
    }

    if (!hasSuit) {
        for (let card of player.cards) {
            card.playable = true;
            card.image.classList.replace('imgNotPlayable', 'imgHand');
            ////console.log("Card : " + card.id + " playable : " + card.playable);
        }
    }
}

function removeCardFromOtherPlayer(otherIndex) {
    const nodeCard = document.getElementById((4 + (otherIndex - player.playingIndex)) % 4);
    if (nodeCard.firstChild) {
        nodeCard.removeChild(nodeCard.lastChild);
    }
    switch ((4 + (otherIndex - player.playingIndex)) % 4) {
        case 0:
            myName.classList.remove('playerOnTurn');
            break;
        case 1:
            playerRight.classList.remove('playerOnTurn');
            break;
        case 2:
            playerUp.classList.remove('playerOnTurn');
            break;
        case 3:
            playerLeft.classList.remove('playerOnTurn');
            break;
        default:
            break;
    }
}

socket.on('connect', () => {
    //socket.emit('playerCreated');
});

socket.on('newPlayer', (otherPlayerName) => {
   players.push(otherPlayerName);
});

socket.on('startingGame', (cards, index, playerNames) => {
    welcomeMsg.style.display = "none";
    player.id = socket.id;
    if (player.playingIndex === -1) {
        player.playingIndex = index;
    }
    showOverallTable(playerNames);
    showNames(playerNames);
    ////console.log("Playing index of" + player.id +" is " + player.playingIndex);
    for (let i = 0; i < 8; i++) {
        let card = new Card(cards[i].suit, cards[i].value);
        let img = new Image();
        img.src = "cards/" + card.value + card.suit + ".png";
        img.id = "cards/" + card.value + card.suit;
        card.id = "cards/" + card.value + card.suit;
        img.classList.add('imgHand');
        card.image = img;
        player.addCard(card);
        img = new Image();
    }
    toggleElements("none", "none", "none", "none", "none", "block");
    //name.style.display = "none";
    document.getElementById('nameLabel').style.display = "none";
    showCardsOfOtherPlayers();
    player.showCards();
});

socket.on('flushDeck', () => {
    //console.log("Flushing deck");
    flushDeck();
});


socket.on('yourTurn', () => {
    socket.emit('myTurn');
    toggleElements("none", "none", "none", "none", "block", "block");
    player.onTurn = true;
    //console.log(player.name + "on turn");
    playableCards();
});

socket.on('sendPoints', () => {
    let data = {
        playerPoints: player.points,
        playerName: player.name,
        playerID: player.id
    };
    socket.emit('sendingPoints', data);
});

socket.on('newCardPlayed', (cardInfo) => {
    let card = new Card(cardInfo.cardSuit, cardInfo.cardValue);
    let img = new Image();
    card.id = cardInfo.cardId;
    img.src = cardInfo.cardId + ".png";
    img.classList.add('imgDeck');
    card.image = img;
    document.getElementById("deck").appendChild(img);
    deck.addCard(card, cardInfo.player_id);
    removeCardFromOtherPlayer(cardInfo.player_index);
});

socket.on('takeDeck', () => {
    player.takeCards(deck.points);
    toggleElements("none", "none","none", "block", "none", "block");
    takeButton.addEventListener("click", takingDeck);
});

socket.on('gameOver', (player_points, player_overall_points, endOfGame, showTable) => {
    //console.log("Client game over, showing table with results");
    showTableResults(player_points, player_overall_points, showTable);
    if (endOfGame) {
        for (let key in player_overall_points) {
            if (player_overall_points[key].playerPoints > 100) {
                document.getElementById('endOfGameMsg').innerHTML = "Koniec hry chuju, hrac "
                    + player_overall_points[key].playerName + " prehral, no to je chuj.";
            }
        }
        document.getElementById('newGame').style.display = "block";
        toggleElements("none", "block", "none", "none", "none", "none");
    } else {
        readyButton.addEventListener("click", playerReady);
    }
});

socket.on('cancellingGame', () => {
    //console.log("Not enough players, deleting elements");
    player.nullParams();
    for (let i = 0; i < 4; i++) {
        const nodeDeck = document.getElementById(i);
        while (nodeDeck.firstChild) {
            nodeDeck.removeChild(nodeDeck.lastChild);
        }
        //document.getElementById(Math.floor( i / 8)).removeChild(document.getElementById(Math.floor( i / 8)).lastChild);
    }
    flushDeck();
    overallTable.style.display = "none";
    toggleElements("block", "none","none", "none", "none", "none");
});

socket.on('choosePoints', () => {
    document.getElementById('choosePoints').style.display = "block";
});

socket.on('IndexOfPlayerOnTurn', (index) => {
    switch ((4 + (index - player.playingIndex)) % 4) {
        case 0:
            myName.classList.add('playerOnTurn');
            break;
        case 1:
            playerRight.classList.add('playerOnTurn');
            break;
        case 2:
            playerUp.classList.add('playerOnTurn');
            break;
        case 3:
            playerLeft.classList.add('playerOnTurn');
            break;
        default:
            break;
    }
});

function subtractPoints(e) {
    e.preventDefault();
    socket.emit('subtract');
    document.getElementById('choosePoints').style.display = "none";
}

function addPoints(e) {
    e.preventDefault();
    socket.emit('add');
    document.getElementById('choosePoints').style.display = "none";
}

function playerReady() {
    socket.emit('playerReady');
    player.nullParams();
    deck.nullParams();
    readyButton.style.display = "none";
    //toggleElements("none", "none", "none", "none", "none", "none");
}

function takingDeck() {
    //console.log("Taking deck");
    flushDeck();
    socket.emit('flushDeck');
    if (player.cards.length !== 0) {
        socket.emit('myTurn');
        player.onTurn = true;
        playableCards();
        toggleElements("none", "none", "none", "none", "block", "block");
    } else {
        //console.log("Player has 0 cards, end game");
        toggleElements("none", "none", "none", "none", "none", "none");
        socket.emit('endGame');
    }
}

function showOverallTable(playerNames) {
    if (overallTable.style.display !== "block"){
            overallTable.style.display = "block";
        let row = 1;
        for (let key in playerNames) {
            overallTable.rows[row].cells[0].innerHTML = playerNames[key];
            overallTable.rows[row].cells[1].innerHTML = "0";
            row++;
        }
    }
}

function showTableResults(player_points, player_overall_points, showTable) {
    toggleElements("none", "none", "block", "none", "none", "none");
    let row = 1;
    if (showTable) {
        resultTable.style.display = "block";
        for (let key in player_points) {
            resultTable.rows[row].cells[0].innerHTML = player_points[key].playerName;
            resultTable.rows[row].cells[1].innerHTML = player_points[key].playerPoints;
            row++;
        }
    } else {

    }

    row = 1;
    for (let key in player_overall_points) {
        overallTable.rows[row].cells[0].innerHTML = player_overall_points[key].playerName;
        overallTable.rows[row].cells[1].innerHTML = player_overall_points[key].playerPoints;
        row++;
    }
}

function showNames(playerNames) {
    for (let key in playerNames) {
        //console.log("Key : " + key + " playerIndex : " + player.playingIndex);
        //console.log((4 + (key - player.playingIndex)) % 4);
        switch ((4 + (key - player.playingIndex)) % 4) {
            case 0:
                myName.innerHTML = playerNames[key];
                myName.style.display = "block";
                break;
            case 1:
                playerRight.innerHTML = playerNames[key];
                playerRight.style.display = "block";
                break;
            case 2:
                playerUp.innerHTML = playerNames[key];
                playerUp.style.display = "block";
                break;
            case 3:
                playerLeft.innerHTML = playerNames[key];
                playerLeft.style.display = "block";
                break;
            default:
                break;
        }
    }
}

function toggleElements(msgE, resultTableE, readyButtonE, takeButtonE, yourTurnE, nameE) {
    msg.style.display = msgE;
    resultTable.style.display = resultTableE;
    readyButton.style.display = readyButtonE;
    takeButton.style.display = takeButtonE;
    yourTurn.style.display = yourTurnE;
    playerLeft.style.display = nameE;
    playerRight.style.display = nameE;
    playerUp.style.display = nameE;
    myName.style.display = nameE;
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    if (player.onTurn === true) {
        event.preventDefault();
        let card_id = event.dataTransfer.getData("text");
        for (let card = 0; card < player.cards.length; card++) {
            if (player.cards[card].id === card_id) {
                if (player.cards[card].playable) {
                    let img = document.getElementById(card_id);
                    img.classList.replace('imgHand', 'imgDeck');
                    if (event.target.id === 'deck') {
                        event.target.appendChild(img);
                    } else {
                        event.target.parentNode.appendChild(img);
                    }
                    deck.addCard(player.cards[card], player.id);
                    let data = {
                        cardId: card_id,
                        cardSuit: player.cards[card].suit,
                        cardValue: player.cards[card].value,
                        player_id: player.id,
                        player_index: player.playingIndex
                    };
                    player.cards.splice(card, 1);
                    socket.emit('moveDone', data);
                    player.onTurn = false;
                    myName.classList.remove('playerOnTurn');
                    toggleElements("none", "none", "none", "none", "none", "block");
                    checkDeck();
                }
            }
        }
    }
}

/* TODO
- add option for player whether he wants to add to other 20 points or subtract from his points 20 points after
  taking 20 points
- all buttons, messages style
- after reaching 100 points, game over

 */
