const socket = io.connect(); // connect to server

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
        this._playingIndex = -1;
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
let deck = new Deck();

const msg = document.getElementById('msg');
const resultTable = document.getElementById('resultTable');
const overallTable = document.getElementById('overallTable');
const takeButton = document.getElementById('takeDeck');
const readyButton = document.getElementById('ready');
const yourTurn = document.getElementById('yourTurn');
const nameButton = document.getElementById('nameButton');
const name = document.getElementById('name');
const nameLabel = document.getElementById('nameLabel');
let welcomeMsg = document.createElement("h2");

function playerName() {
    if (name.value === "") {
        alert("Please fill out your name");
    } else {
        nameLabel.style.display = "none";
        nameButton.style.display = "none";
        name.style.display = "none";
        msg.style.display = "block";

        welcomeMsg.innerHTML = "Welcome " + name.value;
        document.body.appendChild(welcomeMsg);
        player.name = name.value;
        socket.emit('playerCreated');
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
        //console.log("Highest card :" + deck.highestCard.id + " beginningPlayerID :" + deck.beginningPlayer_id);
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
        //console.log("Card : " + card.id + " playable : " + card.playable);
    }

    if (!hasSuit) {
        for (let card of player.cards) {
            card.playable = true;
            card.image.classList.replace('imgNotPlayable', 'imgHand');
            //console.log("Card : " + card.id + " playable : " + card.playable);
        }
    }
}

function removeCardFromOtherPlayer(otherIndex) {
    //console.log("otherIndex : " + otherIndex + "playerIndex : " + player.playingIndex);
    const nodeCard = document.getElementById((4 + (otherIndex - player.playingIndex)) % 4);
    if (nodeCard.firstChild) {
        nodeCard.removeChild(nodeCard.lastChild);
    }
}

socket.on('connect', () => {
    //socket.emit('playerCreated');
});

socket.on('startingGame', (cards, index) => {
    welcomeMsg.style.display = "none";
    player.id = socket.id;
    player.playingIndex = index;
    //console.log("Playing index of" + player.id +" is " + player.playingIndex);
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
    toggleElements("none", "none", "none", "none", "none", "none");
    //name.style.display = "none";
    document.getElementById('nameLabel').style.display = "none";
    showCardsOfOtherPlayers();
    player.showCards();
});

socket.on('flushDeck', () => {
    console.log("Flushing deck");
    flushDeck();
});


socket.on('yourTurn', () => {
    toggleElements("none", "none", "none", "none", "none", "block");
    player.onTurn = true;
    console.log(player.name + "on turn");
    playableCards();
});

socket.on('sendPoints', () => {
    let data = {
        playerPoints: player.points,
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
    toggleElements("none", "none", "none", "none", "block", "none");
    takeButton.addEventListener("click", takingDeck);
});

socket.on('gameOver', (player_points, player_overall_points) => {
    console.log("Client game over, showing table with results");
    showTableResults(player_points, player_overall_points);
    readyButton.addEventListener("click", playerReady);
});

socket.on('notEnoughPlayers', () => {
    console.log("Not enough players, deleting elements");
    player.nullParams();
    for (let i = 0; i < 4; i++) {
        const nodeDeck = document.getElementById(i);
        while (nodeDeck.firstChild) {
            nodeDeck.removeChild(nodeDeck.lastChild);
        }
        //document.getElementById(Math.floor( i / 8)).removeChild(document.getElementById(Math.floor( i / 8)).lastChild);
    }
    flushDeck();
    toggleElements("block", "none", "none", "none", "none", "none");
});

function playerReady() {
    socket.emit('playerReady');
    player.nullParams();
    deck.nullParams();
    toggleElements("none", "none", "none", "none", "none", "none");
}

function takingDeck() {
    console.log("Taking deck");
    flushDeck();
    socket.emit('flushDeck');
    if (player.cards.length !== 0) {
        player.onTurn = true;
        playableCards();
        toggleElements("none", "none", "none", "none", "none", "block");
    } else {
        console.log("Player has 0 cards, end game");
        toggleElements("none", "none", "none", "none", "none", "none");
        socket.emit('endGame');
    }
}

function showTableResults(player_points, player_overall_points) {
    toggleElements("none", "block", "block", "block", "none", "none");
    let row = 1;
    for (let key in player_points) {
        resultTable.rows[row].cells[0].innerHTML = key;
        resultTable.rows[row].cells[1].innerHTML = player_points[key];
        row++;
    }

    row = 1;
    for (let key in player_overall_points) {
        overallTable.rows[row].cells[0].innerHTML = key;
        overallTable.rows[row].cells[1].innerHTML = player_overall_points[key];
        row++;
    }
}

function toggleElements(msgE, resultTableE, overallTableE, readyButtonE, takeButtonE, yourTurnE) {
    msg.style.display = msgE;
    resultTable.style.display = resultTableE;
    overallTable.style.display = overallTableE;
    readyButton.style.display = readyButtonE;
    takeButton.style.display = takeButtonE;
    yourTurn.style.display = yourTurnE;
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
                    event.target.appendChild(img);
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
                    toggleElements("none", "none", "none", "none", "none", "none");
                    checkDeck();
                }
            }
        }
    }
}

/* TODO
- when one player plays card, you can see on your screen that card has been removed from his "hand"
- card in deck wont be hooverable
- results after game over
- after the game, add option to start again
 */
