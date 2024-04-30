import React, { useEffect, useState } from "react";
import {
  gameContract,
  getWeb3Instance,
  loadBoardTree,
} from "../../utils";
import { useAlert } from "../../contexts/PopupContext";
import { useEth } from "../../contexts/EthContext";
import { Form, useRouteLoaderData, useActionData } from "react-router-dom";
import "../Css/End.css";

export const action = async ({ request }) => {
  const form = await request.formData();
  const decision = form.get("decision");
  const address = form.get("address");
  const contract = gameContract(address);
  const accounts = await getWeb3Instance().eth.getAccounts();
  try {
    switch (decision) {
      case "withdraw":
        await contract.methods.Withdraw().send({from: accounts[0]});
        return 1;
        break;
      default:
        return 0;
        break;
    }
  }catch(error) {
    console.log(error);
    return 0;
  }
  return null;
};

export const End = () =>{
  const {state: {accounts}} = useEth();
  const {game,data:
      { 
          player1,
          player2,
          winner,
          currentPhase
      }
  } = useRouteLoaderData("game");

  const winnerLow = winner.toLowerCase();
    

  const success = useActionData();

  const withdraw = () =>{
    return(
      <> 
        <div className="containerEnd">
          <h1 className="winnerEndTitle">The Winner is: {winner}</h1>
          <div>
            {accounts[0] !== winnerLow ? (
              <h2 className="loserEndTitle">The winner is verified! The game is over and you lost</h2>
            ) : (
              <>
                <h2 className="congratsTitle">Congratulations! You can withdraw your prize</h2>
                <Form method="post">
                  <input type="hidden" name ="address" value={game._address}></input>
                    <input type="hidden" name="decision" value="withdraw"></input>
                    <button type="submit" className="withdrawButton"> WITHDRAW</button>
                </Form>
              </>
            )}
          </div>
        </div>
      </>
    )
  };

  const endGame = () =>{
    return(
      <> 
        <div className="containerEnd">
          <h1 className="winnerEndTitle">The Winner is: {winner}</h1>
          <div>
            {accounts[0] !== winnerLow ? (
              <h2 className="loserEndTitle">The winner is verified! The game is over and you lost</h2>
            ) : (
              <>
                <h2 className="congratsTitle">Congratulations!</h2>
              </>
            )}
          </div>
        </div>
      </>
    )
  };

  return success !== 1 ? withdraw() : endGame();

}

