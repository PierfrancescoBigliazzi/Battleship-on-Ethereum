const Battleship = artifacts.require("GamesManager");
const Game = artifacts.require("Game");
const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;
const truffleAssert = require("truffle-assertions");

const setup_game = async(player1, player2) =>{
    const GamesManager = await Battleship.deployed();
    
    const GameTx = await GamesManager.CreateGame({from: player1});
    let game;
    truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
        game = ev._game;
        return ev.owner == player1;
    });

    const JoinGameTx = await GamesManager.JoinGameID(game,{from:player2});
    truffleAssert.eventEmitted(JoinGameTx,"JoinedGame", (ev) =>{
        return ev._game == game;
    });

    return Game.at(game);
};

contract("Test game contract", (accounts) =>{
    let game;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        game = await setup_game(playerOne, playerTwo);
    });

    describe("Play a simple game", () =>{
        const amount = 1000000;

        it("Propose a bet", async() =>{
            const tx = await game.BetAgreement(amount, {from: playerOne});
            truffleAssert.eventEmitted(tx, "BetProposed", (ev) =>{
                return ev._proponent == playerOne && ev._bet == amount;
            });
            const proposedAmount = await game.BetsProposed(playerOne);
            assert.equal(proposedAmount, amount);
        });
        
        it("Same player cannot agree its own bet", async() =>{
            try{
                await game.BetAccepted(amount, {from: playerOne});
                assert.fail("This should be an error");
            }catch(error){
                assert.include(error.message,
                    "revert",
                    "Agreeing to your own bet is something you cannot do");
            }
        });

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player cannot deposited a bet different from the one proposed", async() =>{
            try{
                await game.BetDeposited({from: playerOne, value: amount-1});
                assert.fail("This should be an error");
            }catch(error){
                assert.include(error.message,
                    "revert",
                    "The amount paid must be the same proposed");
            }
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("A player cannot double its bet", async() =>{
            try{
                await game.BetDeposited({from: playerOne, value: amount});
                assert.fail("This should be an error");
            }catch(error){
                assert.include(error.message,
                    "revert",
                    "You cannot double your own bet");
            }
        });

        it("Player two deposits its money", async() =>{
            const tx = await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount * 2);
            truffleAssert.eventEmitted(tx, "BothPlayersPaid", (ev) =>{
                return ev._player1 == playerOne && ev._player2 == playerTwo;
            });
        });

        let p1_tree;
        let p2_tree;

        it("Players commit their boards", async() =>{
            const board = [];
            for(let i = 0; i < 8*8; i++){
                board.push([i < 5, i, i]);
            }
            p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx1 = await game.InitialCommit(p1_tree.root, {from: playerOne});

            truffleAssert.eventEmitted(tx1, "BoardCommited");

            p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx2 = await game.InitialCommit(p2_tree.root, {from: playerTwo});

            truffleAssert.eventEmitted(tx2, "BothPlayersPlacedShips", (ev) =>{
                return ev._player1 == playerOne && ev._player2 == playerTwo; 
            });

        });

        it("Players starts the game", async() =>{
            let tx = await game.FirstAttack(0, {from: playerOne});
            truffleAssert.eventEmitted(tx, "ShotTaken");

            for(let i = 0; i < 5; i++){

                value = p2_tree.values.find((v) => v.value[2] == i).value;
                proof = p2_tree.getProof(i);

                tx = await game.CounterAttack(value[2], value[1], value[0], proof, i, {from: playerTwo});

                if(i == 4){
                    break;
                } 
                truffleAssert.eventEmitted(tx, "ShotTaken");

                value = p1_tree.values.find((v) => v.value[2] == i).value;
                proof = p1_tree.getProof(i);

                tx = await game.CounterAttack(value[2], value[1], value[0], proof, i+1, {from: playerOne});

                truffleAssert.eventEmitted(tx, "ShotTaken");
                //console.log("here");
            }
            //console.log("Player1 wins");
            truffleAssert.eventNotEmitted(tx, "ShotTaken");
            truffleAssert.eventEmitted(tx, "Winner", (ev) =>{
                return ev._player == playerOne;
            });
        });

        it("Check winner board configuration", async() =>{
            
            const shotsTaken = await game.GetShotsTaken(playerTwo)
            //Build an array of indexes
            const allIndexes = Array.from({length: 8*8}, (_,index) => index);
            //console.log(allIndexes);
            const remainingIndexes = allIndexes.filter((index) => !shotsTaken.find((e) => parseInt(e.index) == index));
            //Verify the validity of all the indexes that are not checked yet
            //The indexes that are not checked are the ones that are never been selected
            const { proof, proofFlags, leaves } = p1_tree.getMultiProof(remainingIndexes);

            //console.log(proof);
            //console.log("proof");
            //console.log(proofFlags);
            //console.log(leaves);

            const board = [];
            const salts = [];
            const indexes = [];

            leaves.forEach((e) => {
                board.push(e[0]);
                salts.push(e[1]);
                indexes.push(e[2]);
            });

            //console.log(board);
            //console.log(salts);
            //console.log(indexes);

            const tx = await game.CheckBoard(proof, board, salts, proofFlags, indexes, {from: playerOne,});

            //console.log(tx);

            truffleAssert.eventEmitted(tx, "WinnerVerified", (ev) =>{
                return ev._player == playerOne;
            });

        });

        it("Now a player can withdraw its prize but not the loser", async() =>{
            try{
                await game.Withdraw({from: playerTwo});
                assert.fail("This should be an error");
            }catch(error){
                assert.include(error.message,"revert", "You cannot withdraw the prize; you're not the winner");
            }
        });

        it("The winner withdraw the prize", async() =>{
            const tx = await game.Withdraw({from: playerOne});
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "This should be zero");
        });
    });
});
