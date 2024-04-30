const Battleship = artifacts.require("GamesManager");
const truffleAssert = require("truffle-assertions");

contract("Test game creation", (accounts) =>{
    before(async() =>{
        GamesManager = await Battleship.deployed();
    });

    describe("Create a new game and get its ID", () =>{
        it("Create a game", async() => {
            const playerOne = accounts[0];
            const tx = await GamesManager.CreateGame({
                from: playerOne
            });
            truffleAssert.eventEmitted(tx, "GameCreated", (ev) =>{
                return ev.owner == playerOne;
            });
        }); 
    });
});

contract("Test join by ID", (accounts) =>{
    describe("Join a game by its ID and return it", () =>{
        const playerOne = accounts[0];
        const playerTwo = accounts[1];
        var game;
        it("Create a game", async() =>{
            const tx = await GamesManager.CreateGame({
                from: playerOne
            });
            truffleAssert.eventEmitted(tx, "GameCreated", (ev) =>{
                game = ev._game;
                return ev.owner == playerOne;
            });
        });
        
        it("Join the game", async() =>{
            const tx = await GamesManager.JoinGameID(game, {
                from: playerTwo
            });
            truffleAssert.eventEmitted(tx, "JoinedGame", (ev) =>{
                return ev._game == game;
            });
        });

        it("Trying to join a game already occupied", async() =>{
            const tx = await GamesManager.JoinGameID(game, {from: accounts[2]});
            truffleAssert.eventEmitted(tx, "NoValidGame");
        });

        it("Trying to join the same game twice", async() =>{
            const tx = await GamesManager.JoinGameID(game, {from: playerTwo});
            truffleAssert.eventEmitted(tx, "NoValidGame");
        });
    });
});

contract("Test random join", (accounts) =>{
    describe("Join a game by random", () =>{
        const playerOne = accounts[0];
        const playerTwo = accounts[1];
        const playerThree = accounts[2];
        const playerFour = accounts[3];
        const playerFive = accounts[4];

        it("Create some games", async() =>{
            await GamesManager.CreateGame({from: playerOne});
            await GamesManager.CreateGame({from: playerOne});
            await GamesManager.CreateGame({from: playerOne});
        });


        it("Join a random game", async() =>{
            const tx = await GamesManager.JoinGameRandom({from: playerTwo});
            truffleAssert.eventEmitted(tx,"JoinedGame");
        });

        it("Join a random game", async() =>{
            const tx = await GamesManager.JoinGameRandom({from: playerThree});
            truffleAssert.eventEmitted(tx,"JoinedGame");
        });

        it("Join a random game", async() =>{
            const tx = await GamesManager.JoinGameRandom({from: playerFour});
            truffleAssert.eventEmitted(tx,"JoinedGame");
        });

        it("All the games are not available", async() =>{
            const tx = await GamesManager.JoinGameRandom({from: playerFive});
            truffleAssert.eventEmitted(tx,"NoGameAvailable");
        });
    });
});