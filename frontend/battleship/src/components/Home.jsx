import React from "react";
import { Form, Button} from "react-router-dom";
import logo from '../assets/ethereum-eth-logo.png';
import { useEth } from "../contexts/EthContext";
import {
  gamesManagerContract,
  getWeb3Instance,
} from "../utils";
import "./Css/Home.css";


export const action = async ({ request }) => {
    const form = await request.formData();
    const decision = form.get("decision");
    const address = form.get("address");
    const contract = gamesManagerContract(address);
    console.log("contratto");
    console.log(contract);
    const accounts = await getWeb3Instance().eth.getAccounts();
    console.log(accounts[0]);
    try {
      switch (decision) {
        case "createGame":
          await contract.methods.CreateGame().send({from: accounts[0]}).on('transactionHash', function(hash){
            console.log("Transaction Hash: " + hash);
        }).on('receipt', function(receipt){
            console.log("Receipt: ", receipt);
        }).on('error', console.error);
          break;
    
        case "joinGameByID":
          const gameID = form.get("gameID");
          console.log(gameID);
          await contract.methods.JoinGameID(gameID).send({ from: accounts[0] });
          break;
  
        case "joinRandomGame":
          await contract.methods.JoinGameRandom().send({ from: accounts[0] }).on('transactionHash', function(hash){
            console.log("Transaction Hash: " + hash);
        }).on('receipt', function(receipt){
            console.log("Receipt: ", receipt);
        }).on('error', console.error);
          break;
  
        default:
          return null;
      }
    }catch(err) {
      console.log("An error occurred in the Home page." + err);
    }
  return null;
};

export const Home = () => {
  const accounts = getWeb3Instance().eth.getAccounts();

  const {
    state: { contract },
  } = useEth();

  const Menu = () =>(
    <ul className="shadow-button-set">
    <li>
      <Form method="post">
        <input type="hidden" name="address" value={contract._address} />
        <input type="hidden" name="decision" value="createGame" />
        <button type= "submit">New Game</button>
      </Form>
    </li>
    <li>
      <Form method="post">
        <input type="hidden" name="address" value={contract._address} />
        <input type="hidden" name="decision" value="joinRandomGame" />
        <button type="submit">Join Random Game</button>
      </Form>
    </li>
    <li>
      <Form method="post">
        <input type="hidden" name="address" value={contract._address} />
        <input type="hidden" name="decision" value="joinGameByID" />
        <button type="submit">Join Game by ID</button>
        <input type="text" id="searchTerm" placeholder="Insert the game ID" name="gameID"/>
      </Form>
    </li>
    </ul>
  );

  return(
    <div>
      <img src={logo} alt="MerkEth Battleship Logo" style={{ width: "400px", height: "auto" }}/>
      {Menu()}
    </div>
  );

};

export default Home;