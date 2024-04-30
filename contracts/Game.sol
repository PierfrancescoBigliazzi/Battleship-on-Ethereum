// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Game{

    //Each shot can have three different values:
    //Taken: the shot has been decided and made by the player, he needs to wait that the opponent confirms it
    //Hit: the shot hits a ship
    //Miss: the shot misses a ship
    enum ShotType{
        Miss,
        Hit,
        Taken
    }

    //Each game has different phases:
    //InitialPhase: phase where we need to wait for a second player to join
    //BetPhase: phase where the players propose their bet and make an agreement about them
    //PlacementPhase: phase where each player place their ships on the board
    //ShootingPhase: phase where the game starts and each turn a player decide which cell on the opponent
    //board to shoot
    //WinningPhase: phase where the game is over but the winner has to validate his board configuration
    //EndPhase: phase where the winner is verified and he can withdraw his prize
    enum Phase{
        InitialPhase,
        BetPhase,
        PlacementPhase,
        ShootingPhase,
        WinningPhase,
        EndPhase
    }

    //Data structure used to represent a shot in the game
    //The index is the position in the board while the state is one between taken, hit or miss
    struct Shot{
        uint8 index;
        ShotType state;
    }
    
    address public owner;
    
    address public player1;
    address public player2;

    address public winner;
    //Memorize the turn of the player
    address public turn;


    mapping(address => bool) public AFKplayer;
    //Bets proposed by the players
    mapping(address => uint256) public BetsProposed;
    //Memorize which player has yet paid
    mapping(address => bool) public PlayerPaid;
    //Store the Merkle tree root of both players
    mapping(address => bytes32) BoardMerkleTreeRoot;

    mapping(address => uint8) public HittedShips;

    mapping(address => Shot[]) public ShotsTaken;

    mapping(address => mapping (uint8 => bool)) public ShotsMap;

    //The board has 64 cells
    uint8 constant CELLS = 8*8;

    //Design choice: all the ships are 1x1
    //This is a simplifying assumption since in a real game the ships can have a variable length
    //This choice has been done to handle in a more efficient way the management of the game since
    //ships with variable length would be more complicated in terms of representation (the leaves in 
    //the Merkle tree should store a state which consider not only the position but also something more)
    //e.g. a ship could be represented as a triple (position, length, direction)
    uint8 constant SHIPS = 5;

    uint256 public bet;

    uint public timeout;

    Phase public currentPhase;

    modifier OnlyPlayer(){
        require(msg.sender == player1 || msg.sender == player2);
        _;
    }

    modifier CheckAFK(){
        if(AFKplayer[msg.sender] == true){
            if(block.number < timeout){
                AFKplayer[msg.sender] = false;
            }else if (block.number >= timeout){
                WinCondition(msg.sender == player1 ? player2 : player1);
                return;
            }
        }
        _;
    }

    event BetProposed(address indexed _proponent, uint256 _bet);

    event BetAgreed(address indexed _player1, address indexed _player2, uint256 _bet);

    event BothPlayersPaid(address indexed _player1, address indexed _player2);

    event BothPlayersPlacedShips(address indexed _player1, address indexed _player2);

    event BoardChecked(address _player);

    event BoardCommited(address _player, bytes32 merkleTreeRoot);

    event ShotTaken(address _player, uint8 _index);

    event Winner(address _player);

    event WinnerVerified(address _player);

    event AFKwarning(address _player);

    event NoMoreAFK(address _player);


    constructor(address _owner){
        owner = _owner;
        player1 = _owner;
        currentPhase = Phase.InitialPhase;
    }

    function RegisterSecondPlayer(address SecondPlayer) external{
        require(player2 == address(0));
        player2 = SecondPlayer;
        currentPhase = Phase.BetPhase;
    }

    function BetAgreement(uint256 _bet) external OnlyPlayer{
        require(_bet > 0);
        require(currentPhase == Phase.BetPhase);
        BetsProposed[msg.sender] = _bet;
        emit BetProposed(msg.sender, _bet);
    }

    function BetAccepted(uint256 _bet) external OnlyPlayer{
        require(_bet > 0);
        require(currentPhase == Phase.BetPhase);
        require((msg.sender == player1 && _bet == BetsProposed[player2]) ||
        (player2 == msg.sender && _bet == BetsProposed[player1]), "Amount invalid or does not match with the players");
        bet = _bet;
        emit BetAgreed(player1, player2, bet);
    }

    function BetDeposited() external payable OnlyPlayer CheckAFK{
        require(currentPhase == Phase.BetPhase);
        require(PlayerPaid[msg.sender] == false && msg.value == bet, "The bet must be the one agreed");
        PlayerPaid[msg.sender] = true;

        if(PlayerPaid[player1] == true && PlayerPaid[player2] == true){
            emit BothPlayersPaid(player1, player2);
            currentPhase = Phase.PlacementPhase;
        }

    }

    //A player can accuse the other player of being AFK
    //A player can be AFK if:
    //- In bet phase he/she has not deposited his/her bet yet
    //- In placement phase he/she has not committed yet his/her board
    //- In shooting phase he/she has not done a move yet
    //- In winning phase he/she has not draw the money
    function ReportAFK() external OnlyPlayer{
        address opponent = msg.sender == player1 ? player2 : player1;
        require((currentPhase == Phase.BetPhase && PlayerPaid[opponent] == false) ||
        (currentPhase == Phase.PlacementPhase && BoardMerkleTreeRoot[opponent] == 0) ||
        (currentPhase == Phase.ShootingPhase && turn == opponent) ||
        (currentPhase == Phase.WinningPhase && winner == opponent));
        require(AFKplayer[opponent] == false);

        emit AFKwarning(opponent);

        AFKplayer[opponent] = true;
        timeout = block.number +5;
    }

    function VerifyAFK() external OnlyPlayer{
        address opponent = msg.sender == player1 ? player2 : player1;
        require((currentPhase == Phase.BetPhase && PlayerPaid[opponent] == false) ||
        (currentPhase == Phase.PlacementPhase && BoardMerkleTreeRoot[opponent] == 0) ||
        (currentPhase == Phase.ShootingPhase && turn == opponent) ||
        (currentPhase == Phase.WinningPhase && winner == opponent));

        if(AFKplayer[opponent] == true && block.number >= timeout){
            currentPhase = Phase.WinningPhase;
            WinCondition(msg.sender);
        }else{
            AFKplayer[opponent] = false;
            emit NoMoreAFK(opponent);
        }
    }

    function GetShotsTaken(address _player) external view returns(Shot[] memory){
        return ShotsTaken[_player];
    }

    function InitialCommit(bytes32 merkleTreeRoot) external OnlyPlayer CheckAFK{
        require(currentPhase == Phase.PlacementPhase && BoardMerkleTreeRoot[msg.sender] == 0, "You already committed the board");
        BoardMerkleTreeRoot[msg.sender] = merkleTreeRoot;

        //If both players have committed their boards then they can move to the next phase
        if(BoardMerkleTreeRoot[player1] != 0 && BoardMerkleTreeRoot[player2] != 0){
            currentPhase = Phase.ShootingPhase;
            emit BothPlayersPlacedShips(player1, player2);
            uint256 PlayTurn = uint256(keccak256(abi.encodePacked(player1, player2))) %2;
            if (PlayTurn == 0){
                turn = player1;
            }else{
                turn = player2;
            }
            HittedShips[player1] = 0;
            HittedShips[player1] = 0;
        }
        
        emit BoardCommited(msg.sender,merkleTreeRoot);
    }

    function FirstAttack(uint8 _index) external OnlyPlayer CheckAFK{
        Attack(_index);
    }

    function Attack(uint8 _index) internal OnlyPlayer{
        require(_index < CELLS, "Invalid Cell");
        require(ShotsMap[msg.sender][_index] == false, "You already select this cell");
        require(currentPhase == Phase.ShootingPhase);
        ShotsMap[msg.sender][_index] = true;
        ShotsTaken[msg.sender].push(Shot(_index,ShotType.Taken));

        turn = msg.sender == player1 ? player2 : player1;

        emit ShotTaken(msg.sender, _index);
    }

    //_hitted refers to the presence or less of a ship in the board configuration
    function CounterAttack(uint8 _index, uint256 _salt, bool _hitted, bytes32[] memory _proof, uint8 _attackIndex) external OnlyPlayer CheckAFK{
        require(_index < CELLS);
        require(_attackIndex < CELLS);
        require(currentPhase == Phase.ShootingPhase);
        
        address opponent = msg.sender == player1 ? player2 : player1;
        //Last shot is the one that needs to be evaluated
        uint256 last = ShotsTaken[opponent].length -1;
        require(ShotsTaken[opponent][last].index == _index);
        assert(ShotsTaken[opponent][last].state == ShotType.Taken);

        //Check proof PART
        //-
        //-
    

        if(!CheckProof(_hitted, _salt, _proof, BoardMerkleTreeRoot[msg.sender], _index)){
            currentPhase = Phase.WinningPhase;
            WinCondition(opponent);
            return;
        }

        if(_hitted == true){
            ShotsTaken[opponent][last].state = ShotType.Hit;
            HittedShips[msg.sender]++;

            if(HittedShips[msg.sender] == SHIPS){
                emit Winner(opponent);
                winner = opponent;
                currentPhase = Phase.WinningPhase;
                return;
            }
        }else{
            ShotsTaken[opponent][last].state = ShotType.Miss;
        }

        Attack(_attackIndex);
    }

    function CheckBoard(bytes32[] memory _proof, bool[] memory _ships, uint256[] memory _salts, bool[] memory _proofFlags, uint8[] memory _indexes) external OnlyPlayer CheckAFK{
        require(currentPhase == Phase.WinningPhase);
        require(_ships.length == _salts.length);
        require(_indexes.length == _ships.length);


        address opponent = msg.sender == player1 ? player2 : player1; 

        uint8 ships = 0;

        //emit BoardChecked(msg.sender);

        if(!CheckMultiProof(_proof, _ships, _salts, _proofFlags, BoardMerkleTreeRoot[msg.sender], _indexes)){
            WinCondition(opponent);
            return;
        }

        //emit BoardChecked(msg.sender);

        for(uint8 i = 0; i < _ships.length; i++){

            //Check that the indexes are not greater than the number of cells
            //In this case this means that the winner has provided a false configuration of the board
            if(_indexes[i] >= CELLS){
                WinCondition(opponent);
                return;
            }

            //Check that the indexes needs to be controlled yet
            assert(!ShotsMap[opponent][_indexes[i]]);
            ShotsMap[opponent][_indexes[i]] = true;

            if(_ships[i] == true){
                ships++;
            }
        }

        //emit BoardChecked(msg.sender);

        for(uint8 i = 0; i < CELLS; i++){
            if(ShotsMap[opponent][i] == false){
                WinCondition(opponent);
                return;
            }
        }

        if(ships + HittedShips[msg.sender] == SHIPS){
            WinCondition(msg.sender);
        }else{
            WinCondition(opponent);
        }

        emit BoardChecked(msg.sender);
    }

    function Withdraw() external{
        require(currentPhase == Phase.EndPhase);
        require(msg.sender == winner);
        payable(winner).transfer(address(this).balance);

    }

    function WinCondition(address _winner) internal {
        require(currentPhase == Phase.WinningPhase);
        //require(winner == address(0));
        winner = _winner;
        currentPhase = Phase.EndPhase;
        emit WinnerVerified(_winner);
    }

    function CheckProof(bool _ship, uint256 _salt, bytes32[] memory _proof,bytes32 _root, uint8 _index) internal pure returns(bool){
        bytes32 leaf = EncodeLeaf(_ship, _salt, _index);
        return MerkleProof.verify(_proof, _root, leaf);
    }

    function CheckMultiProof(bytes32[] memory _proof, bool[] memory _ships, uint256[] memory _salts,bool[] memory _proofFlags, bytes32 _root, uint8[] memory _indexes) internal pure returns(bool){
        bytes32[] memory leaves = new bytes32[](_ships.length);
        for (uint8 i = 0; i < _ships.length; i++){
            leaves[i] = EncodeLeaf(_ships[i], _salts[i], _indexes[i]);
        }
        return MerkleProof.multiProofVerify(_proof, _proofFlags, _root, leaves);
    }
    function EncodeLeaf(bool _ship, uint256 _salt, uint8 _index) internal pure returns(bytes32){
        return keccak256(bytes.concat(keccak256(abi.encode(_ship, _salt, _index))));
    }





}