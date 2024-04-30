const Battleship = artifacts.require("GamesManager");
const Game = artifacts.require("Game");
const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;
const truffleAssert = require("truffle-assertions");

contract("Test AFK functions in different phases - bet phase", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("PlayerOne accuses playerTwo of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerOne});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("Wait for 5 blocks", async() =>{
            for(let i = 0; i < 5; i++){
                await GamesManager.CreateGame({from: playerOne});
            }
        });

        it("Verify if playerTwo is AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerOne});
            truffleAssert.eventEmitted(tx,"WinnerVerified");
        });

        it("playerOne withdraws its winnings", async () => {
            await game.Withdraw({ from: playerOne });
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "Balance should be zero");
          });
    });
});

contract("Test AFK functions in different phases - placement phase", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("The second player deposits its money", async() =>{
            await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount*2);
        });

        let p1_tree;
        let p2_tree;

        it("A player commits his board", async() =>{
            const board = [];
            for(let i = 0; i < 8*8; i++){
                board.push([i < 5, i, i]);
            }
            p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx1 = await game.InitialCommit(p1_tree.root, {from: playerOne});

            truffleAssert.eventEmitted(tx1, "BoardCommited");
        });

        it("PlayerOne accuses playerTwo of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerOne});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("Wait for 5 blocks", async() =>{
            for(let i = 0; i < 5; i++){
                await GamesManager.CreateGame({from: playerOne});
            }
        });

        it("Verify if playerTwo is AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerOne});
            truffleAssert.eventEmitted(tx,"WinnerVerified");
        });

        it("playerOne withdraws its winnings", async () => {
            await game.Withdraw({ from: playerOne });
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "Balance should be zero");
          });
    });
});

contract("Test AFK functions in different phases - shooting phase", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("The second player deposits its money", async() =>{
            await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount*2);
        });

        let p1_tree;
        let p2_tree;

        it("A player commits his board", async() =>{
            const board = [];
            for(let i = 0; i < 8*8; i++){
                board.push([i < 5, i, i]);
            }
            p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx1 = await game.InitialCommit(p1_tree.root, {from: playerOne});

            truffleAssert.eventEmitted(tx1, "BoardCommited");

            p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx2 = await game.InitialCommit(p1_tree.root, {from: playerTwo});

            truffleAssert.eventEmitted(tx2, "BoardCommited");
        });

        it("PlayerTwo shots", async() =>{
            const tx = await game.FirstAttack(0, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "ShotTaken");
        });

        it("PlayerTwo accuses playerOne of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("Wait for 5 blocks", async() =>{
            for(let i = 0; i < 5; i++){
                await GamesManager.CreateGame({from: playerTwo});
            }
        });

        it("Verify if playerOne is AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"WinnerVerified");
        });

        it("playerTwo withdraws its winnings", async () => {
            await game.Withdraw({ from: playerTwo });
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "Balance should be zero");
          });
    });
});

contract("Test AFK functions in different phases - winning phase", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("The second player deposits its money", async() =>{
            await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount*2);
        });

        let p1_tree;
        let p2_tree;

        it("A player commits his board", async() =>{
            const board = [];
            for(let i = 0; i < 8*8; i++){
                board.push([i < 5, i, i]);
            }
            p1_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx1 = await game.InitialCommit(p1_tree.root, {from: playerOne});

            truffleAssert.eventEmitted(tx1, "BoardCommited");

            p2_tree = StandardMerkleTree.of(board, ["bool", "uint256", "uint8"]);

            const tx2 = await game.InitialCommit(p1_tree.root, {from: playerTwo});

            truffleAssert.eventEmitted(tx2, "BoardCommited");
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
            }
            //console.log("Player1 wins");
            truffleAssert.eventNotEmitted(tx, "ShotTaken");
            truffleAssert.eventEmitted(tx, "Winner", (ev) =>{
                return ev._player == playerOne;
            });
        });

        it("Wait for 5 blocks", async() =>{
            for(let i = 0; i < 5; i++){
                await GamesManager.CreateGame({from: playerTwo});
            }
        });

        it("PlayerTwo accuses playerOne of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("Wait for 5 blocks", async() =>{
            for(let i = 0; i < 5; i++){
                await GamesManager.CreateGame({from: playerTwo});
            }
        });

        it("Verify if playerOne is AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"WinnerVerified");
        });

        it("playerTwo withdraws its winnings", async () => {
            await game.Withdraw({ from: playerTwo });
            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, 0, "Balance should be zero");
          });
    });
});

contract("Test if the player has been moved during the next three blocks", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("The second player deposits its money", async() =>{
            await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount*2);
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

            const tx2 = await game.InitialCommit(p1_tree.root, {from: playerTwo});

            truffleAssert.eventEmitted(tx2, "BoardCommited");
        });

        it("PlayerTwo shots", async() =>{
            const tx = await game.FirstAttack(0, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "ShotTaken");
        });

        it("PlayerTwo accuses playerOne of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("Wait for 3 blocks", async() =>{
            for(let i = 0; i < 3; i++){
                await GamesManager.CreateGame({from: playerTwo});
            }
        });

        it("Verify that playerOne is NOT AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerTwo});
            truffleAssert.eventEmitted(tx,"NoMoreAFK");
        });

        
    });

});

contract("Test if the player has been moved", (accounts) =>{
    let game;
    let GamesManager;
    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    before(async() =>{
        GamesManager = await Battleship.deployed();
        const GameTx = await GamesManager.CreateGame({from: playerOne});
        let addr;
        truffleAssert.eventEmitted(GameTx, "GameCreated", (ev) =>{
            addr = ev._game;
            return ev.owner == playerOne;
        });

        game = await Game.at(addr);
    
        const JoinGameTx = await GamesManager.JoinGameID(addr, {from:playerTwo});
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

        it("Another player agrees the bet", async() =>{
            const tx = await game.BetAccepted(amount, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "BetAgreed", (ev) =>{
                return ev._bet == amount;
            });
            const bet = await game.bet();
            assert.equal(bet, amount);
        });

        it("A player deposits its money", async() =>{
            await game.BetDeposited({from: playerOne, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount);
        });

        it("PlayerOne accuses playerOne of being AFK", async() =>{
            const tx = await game.ReportAFK({from: playerOne});
            truffleAssert.eventEmitted(tx,"AFKwarning");
        });

        it("PlayerTwo deposits its money", async() =>{
            await game.BetDeposited({from: playerTwo, value: amount});

            const balance = await web3.eth.getBalance(game.address);
            assert.equal(balance, amount*2);
        });

        it("Verify that playerTwo is NOT AFK", async() =>{
            const tx = await game.VerifyAFK({from: playerOne});
            truffleAssert.eventNotEmitted(tx,"WinnerVerified");
        });


    });
});