const Battleship = artifacts.require("GamesManager");
const Game = artifacts.require("Game");
const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;
const truffleAssert = require("truffle-assertions");
const fs = require("fs");
const gas_file = "gas_analysis.json";


fs.writeFileSync(gas_file, JSON.stringify({}));

contract("Test GamesManager contract - gas cost", (accounts) => {
    const playerOne = accounts[0];
    const playerTwo = accounts[1];
    const playerThree = accounts[2];
    const playerFour = accounts[3];
    const playerFive = accounts[4];
    const data = {};
    let gamesManager;
    let game;

    before(async() =>{

        gamesManager = await Battleship.deployed();
        const tx = await gamesManager.CreateGame({from: playerOne});
        data.CreateGame = tx.receipt.gasUsed;
        let addr;
        truffleAssert.eventEmitted(tx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });
        game = await Game.at(addr);
        const tx2 = await gamesManager.JoinGameID(addr, {from: playerTwo});
        data.JoinGameID = tx2.receipt.gasUsed;
    });



    describe("Create a new game and join it randomly", () => {  
      
        it("Create a series of game", async () => {
            const tx = await gamesManager.CreateGame({ from: playerOne });
            const tx2 = await gamesManager.CreateGame({from: playerTwo});
            const tx3 = await gamesManager.CreateGame({from: playerThree});
            //data.CreateGame = tx.receipt.gasUsed;
            //console.log(data);
        });

  
        // playerTwo should be able to join.
        it("PlayerTwo joins a random game", async () => {
            const tx = await gamesManager.JoinGameRandom({ from: playerTwo });
            truffleAssert.eventEmitted(tx, "JoinedGame");
            data.JoinGameRandom = tx.receipt.gasUsed;
            console.log(data);
        });

        it("Save gas used in file", async() =>{
            const file = JSON.parse(fs.readFileSync(gas_file));
            fs.writeFileSync(gas_file, JSON.stringify({...data,...file}));
        });
    });

    describe("Evaluate the victory due to an AFK player", () =>{
        const amount = 100000;

        it("Propose a bet", async() =>{
            const tx = await game.BetAgreement(amount, {from: playerOne});
            data.BetAgreement = tx.receipt.gasUsed; 
        });

        it("Accept the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            data.BetAccepted = tx.receipt.gasUsed;
        });

        it("Deposit the bet", async() =>{
            const tx = await game.BetDeposited({from: playerOne, value: amount});
            data.BetDeposited = tx.receipt.gasUsed;
        });

        it("Accuse the other of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerOne});
            data.ReportAFK = tx.receipt.gasUsed;
        });

        
        it("Wait for five blocks", async () => {
            for (let i = 0; i < 6; i++){
                await gamesManager.CreateGame({from: playerOne});
            }
        });

        it("Verify if playerTwo is AFK", async() =>{
            const tx = await game.VerifyAFK();
            data.VerifyAFK = tx.receipt.gasUsed;
        })

        it("Save gas used in file", async() =>{
            const file = JSON.parse(fs.readFileSync(gas_file));
            fs.writeFileSync(gas_file, JSON.stringify({...data,...file}));
        });

    });
});

contract("Compute gas for a full game (8*8) with all misses", (accounts) =>{
    const playerOne = accounts[0];
    const playerTwo = accounts[1];
    const playerThree = accounts[2];
    const playerFour = accounts[3];
    const playerFive = accounts[4];
    const data = {};
    let gamesManager;
    let game;

    before(async() =>{

        gamesManager = await Battleship.deployed();
        const tx = await gamesManager.CreateGame({from: playerOne});
        data.CreateGame = tx.receipt.gasUsed;
        let addr;
        truffleAssert.eventEmitted(tx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });
        game = await Game.at(addr);
        const tx2 = await gamesManager.JoinGameID(addr, {from: playerTwo});
        data.JoinGameID = tx2.receipt.gasUsed;
    });



    describe("Create a new game and join it randomly", () => {  
      
        it("Create a series of game", async () => {
            const tx = await gamesManager.CreateGame({ from: playerOne });
            const tx2 = await gamesManager.CreateGame({from: playerTwo});
            const tx3 = await gamesManager.CreateGame({from: playerThree});
            //data.CreateGame = tx.receipt.gasUsed;
            //console.log(data);
        });

  
        // playerTwo should be able to join.
        it("PlayerTwo joins a random game", async () => {
            const tx = await gamesManager.JoinGameRandom({ from: playerTwo });
            truffleAssert.eventEmitted(tx, "JoinedGame");
            data.JoinGameRandom = tx.receipt.gasUsed;
            console.log(data);
        });
    });

    describe("Play the game", () =>{
        const amount = 100000;

        it("Propose a bet", async() =>{
            const tx = await game.BetAgreement(amount, {from: playerOne});
            truffleAssert.eventEmitted(tx, "BetProposed", (ev) =>{
                return ev._proponent == playerOne && ev._bet == amount;
            });
            data.BetAgreement = tx.receipt.gasUsed;
            const proposedAmount = await game.BetsProposed(playerOne);
            assert.equal(proposedAmount, amount);
        });

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            data.BetAccepted = tx.receipt.gasUsed;
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            const tx = await game.BetDeposited({from: playerOne, value: amount});
            data.BetDeposited = tx.receipt.gasUsed;
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("Player two deposits its money", async() =>{
            const tx = await game.BetDeposited({from: playerTwo, value: amount});
            data.BetDeposited = tx.receipt.gasUsed;
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
            data.InitialCommit = tx1.receipt.gasUsed;
            truffleAssert.eventEmitted(tx1, "BoardCommited");

            p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);
            const tx2 = await game.InitialCommit(p2_tree.root, {from: playerTwo});
            truffleAssert.eventEmitted(tx2, "BothPlayersPlacedShips", (ev) =>{
                return ev._player1 == playerOne && ev._player2 == playerTwo; 
            });
        });

        it("Players starts the game and misses all the shots (58 misses)", async() =>{
            let tx = await game.FirstAttack(63, {from: playerOne});
            truffleAssert.eventEmitted(tx, "ShotTaken");
            data.FirstAttack = tx.receipt.gasUsed;

            for(let i = 63; i >= 0; i--){

                value = p2_tree.values.find((v) => v.value[2] == i).value;
                proof = p2_tree.getProof(i);

                tx = await game.CounterAttack(value[2], value[1], value[0], proof, i, {from: playerTwo});
                data.CounterAttack = tx.receipt.gasUsed;

                if(i == 0){
                    break;
                } 
                truffleAssert.eventEmitted(tx, "ShotTaken");

                value = p1_tree.values.find((v) => v.value[2] == i).value;
                proof = p1_tree.getProof(i);

                tx = await game.CounterAttack(value[2], value[1], value[0], proof, i-1, {from: playerOne});

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
            
            const shotsTaken = await game.GetShotsTaken(playerTwo);
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
            data.CheckBoard = tx.receipt.gasUsed;

            //console.log(tx);

            truffleAssert.eventEmitted(tx, "WinnerVerified", (ev) =>{
                return ev._player == playerOne;
            });

        });

        it("The winner withdraw the prize", async() =>{
            const tx = await game.Withdraw({from: playerOne});
            data.Withdraw = tx.receipt.gasUsed;
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "This should be zero");
        });

        it("Save gas used in file", async() =>{
            const file = JSON.parse(fs.readFileSync(gas_file));
            fs.writeFileSync(gas_file, JSON.stringify({...data,...file}));
        });
    });
});


