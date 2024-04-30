var GamesManager = artifacts.require("GamesManager");

module.exports = function(deployer){
    deployer.deploy(GamesManager);
};