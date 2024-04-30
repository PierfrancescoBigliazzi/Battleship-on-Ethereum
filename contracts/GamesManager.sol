// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Game.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract GamesManager{

    Game[] private joinableGames;
    //mapping the list of joinable games into an array of indexes used to refer to a specific game
    mapping(Game => uint256) joinableGamesIndexes;
    //false = NOT joinable; true = joinable
    mapping(Game => bool) joinableGamesStatus;
    //Nonce used for pseudo-random generator of game ID
    uint256 private nonce;

    event GameCreated(address indexed owner, Game _game);

    event JoinedGame(address indexed player, Game _game);

    event NoGameAvailable(address indexed player);

    event NoValidGame(address indexed player);
    

    function CreateGame() external{
        //emit Start(msg.sender);
        Game battleshipGame = new Game(msg.sender);
        //emit Reach(msg.sender);
        _addGame(battleshipGame);
        emit GameCreated(msg.sender, battleshipGame);
    }

    function JoinGameID(Game _ID) external{
        //The game must be in the list of joinable games and the player who joins must not be the owner of the game
        if(!joinableGamesStatus[_ID] || _ID.owner() == msg.sender){
            emit NoValidGame(msg.sender);
            return;
        }
        //Player 1 is always the owner
        _ID.RegisterSecondPlayer(msg.sender);

        RemoveGame(_ID);

        emit JoinedGame(msg.sender, _ID);
    }

    function JoinGameRandom() external{
        //Generate a random index to access joinable games list by using the blockhash of the previous block,
        //the address of the caller and a local nonce which is incremented each time the function is called
        if(joinableGames.length < 1){
            emit NoGameAvailable(msg.sender);
            return;
        }
        uint256 random = uint256(keccak256(abi.encodePacked(blockhash(block.number -1), msg.sender, nonce))) % joinableGames.length; 
        nonce++;

        bool found = false;
        for(uint256 i = random; i < joinableGames.length; i++){
            Game _game = joinableGames[(i % joinableGames.length)];

            if(_game.owner() != msg.sender){
                found = true;
                _game.RegisterSecondPlayer(msg.sender);
                RemoveGame(_game);
                emit JoinedGame(msg.sender, _game);
                break;
            }

        }
        if(!found){
            emit NoGameAvailable(msg.sender);
        }
    }

    function RemoveGame(Game _ID) internal{
        assert(joinableGamesStatus[_ID] == true);
        delete(joinableGamesStatus[_ID]);

        uint256 index = joinableGamesIndexes[_ID];

        //If the game is the last one in the list or the list is filled with just one element then you just need to pop it out
        if(index == joinableGames.length -1 || joinableGames.length == 1){
            joinableGames.pop();
        }else{
            //The game is in the middle of the list so you need first to make it the last element of the list
            joinableGames[index] = joinableGames[joinableGames.length -1];
            //Then you just pop it out
            joinableGames.pop();
            joinableGamesIndexes[joinableGames[index]] = index;
        }

        delete joinableGamesIndexes[_ID];
    }
    function _addGame(Game _ID) internal{
        //Add the game in the list of joinable games and set its status to joinable (true)
        joinableGamesStatus[_ID] = true;
        joinableGames.push(_ID);
        joinableGamesIndexes[_ID] = joinableGames.length -1;
    }
}