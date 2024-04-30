import { useEffect, useState } from "react";
import { Form, useRouteLoaderData } from "react-router-dom";
import { useEth } from "../../contexts/EthContext";
import { usePop } from "../../contexts/PopupContext";
import { Board } from "../Board.jsx";
import {
  gameContract,
  getWeb3Instance,
  rndNonce,
  saveBoard,
  saveBoardTree,
  SHIPS,
} from "../../utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import "../Css/Place.css";

export const action = async ({request}) =>{
  const form = await request.formData();
  const address = form.get("address");
  const board = form.get("boardState");
  const contract = gameContract(address);
  const accounts = await getWeb3Instance().eth.getAccounts();


  console.log(board);

  const filteredBoard = board.split(",").filter((value) => value !== "");

  console.log(filteredBoard);

  const leaves = [];
  for (let i=0; i < filteredBoard.length; i++){
    const Value = filteredBoard[i];
    leaves.push([parseInt(Value), rndNonce(), i])
  }

  const tree = StandardMerkleTree.of(leaves, ["bool", "uint256", "uint8"]);
  const root = tree.root;

  //Store the tree and the root in the local storage
  await saveBoard(leaves);
  await saveBoardTree(tree.dump());

  try{
    await contract.methods.InitialCommit(root).send({from: accounts[0]});
  } catch(error){
    console.log(error);
  }

  return null;

};

export const Place = () =>{
  const { state: {accounts}} = useEth();

  const { game } = useRouteLoaderData("game");

  const {setPop} = usePop();

  //Define a storage where to store the state of the board
  const [board, setBoard] = useState([]);

  //Callback function to handle board changes
  const BoardChanges = (newBoardState) =>{
    setBoard(newBoardState);
  };

  useEffect(() =>{
    game.events.BoardCommited({ filter: { _player: accounts[0]}}).on("data",(e) =>{
      console.log(e.returnValues.merkleTreeRoot);
      setPop("Board committed!", "success");
    });
  });

  return(
    <>
      <Board changeOnBoard = {BoardChanges}>
      </Board>
      <div>
        {board.flat().filter((value) => value === 1).length === SHIPS ? (
          <Form method="post">
            <input type="hidden" name="address" value={game._address} />
            <input type="hidden" name="boardState" value={board} />
            <button type="submit" className="buttonCommit">
                Commit board
            </button>
          </Form>
        ) : (
          <h2 className="warning">You must place all your ships!</h2>
        )
        }
      </div> 
    </>
  )



}


