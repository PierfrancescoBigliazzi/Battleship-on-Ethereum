The Battleship board game is played by two players who cannot see each others’ board until the end of the game. The game operates on hidden information, and that hidden state influences each action taken by the players.

The game is divided into two phases: during the placement phase, each player places k ships of varying lengths and of constant width on their board, a n X n matrix which represents a coarse discretization of the ocean. 
After the first phase, the game proceeds to the shooting phase, which consists of players taking turns and making guesses about the location of the ships on the opponent’s board (referred to as launching a torpedo).
The guess consists of telling the opponents the coordinates [i,j] of a zone of the board. If any of the opponent’s ships are at that location, the opponent replies “Hit!”, otherwise “Miss!”.
Once all the squares that the ship occupies have been hit, the ship is considered “sunk”.

The termination of the game happens when one of the players has sunk all of their opponent’s ships and that player wins the game.

A battleship game may be played on the Internet and is normally hosted on a third-party centralized server.
However, in a centralized server scenario, the players must rely on the information coming from the server, since it acts as a mediator. If the server is not trusted, it may decide to send the wrong information to the players, and this is particularly critical if the game involves a reward for the winner, since an untrusted server may tamper with the player's actions in order not to transfer the money to the winner.

The project requires the implementation of the Battleship game on the Ethereum blockchain, so that the properties of the blockchain, i.e. tamper-freeness, the possibility of auditing the fair rules of the game, encoded in smart contracts, instant and secure reward payments, and secure rewarding implementation, can be exploited. Furthermore, implementing the game on a permissionless blockchain implies that participating in the game cannot be prevented from anyone, since there is no censoring authority.
