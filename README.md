# Card game - chuj

This card game was created because of Covid-19, because I was unable to return home and play this game with my friends. 
Since I really wanted to play this game and I didn't know when could I return, I started studying these on my own :
- javascript,
- html,
- css,
- client/server logic.

At the moment, the game does not work since the game server is offline.

However, when it is online, it works for 4 players. There are som known bugs, but development is currently suspended.

# RULES:
- Each player opens game link and writes name
- When all 4 players are connected, game begins
- Each player gets 8 cards
- Player who is on the move is playing one of his cards
- Other player who is on the move must play card with same suit, which was played by the first player
    - If he doesn't have the suit, he can play any card he want from his cards
- After every player played his card, the evaluation begins
    - Only cards with the same suit as the first played card in this round was played are evaluated
    - Player, who played the biggest rank is taking this pile of 4 cards
        - These cards are out of the game, but all cards belongs to player who took them
- Player who took pile of cards begins the next round
- This continues untill players have no other cards

# POINT SYSTEM:
- Some cards have value of points
    - Every card with "heart" suit is evaluated by 1 point
    - Rank 12 suit "spades" is evaluated by 8 points
    - Rank 12 suit "clubs" is evaluated by 4 points

- After the game, each player reviews all his cards and counts points
    - When some player gets all 20 possible points from one round of the game, he wins and he may choose whether:
        - He wants to distract 20 points from his currently gained points
        - Add 20 points to all other players
- Points are after each game added to each player's overall points
- First who got more than 100 points loses
    - Special situation when player gets exactly 100 points means, that player's point are reduced to 80 points
