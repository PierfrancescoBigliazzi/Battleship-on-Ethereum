import {
    Form,
    useRouteLoaderData,
    useNavigate,
  } from "react-router-dom";
import React, { useEffect } from "react";
import { usePop } from "../../contexts/PopupContext";
import { useEth } from "../../contexts/EthContext";
import {
    getWeb3Instance,
    gameContract,
    loadBoardTree,
    SIZE
} from "./../../utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import "../Css/Win.css";

export const action = async({request}) =>{
    const form = await request.formData();
    const decision = form.get("decision");
    const address = form.get("address");
    const opponent = form.get("opponent");
    const contract = gameContract(address);
    console.log("address");
    console.log(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    const tree = StandardMerkleTree.load(await loadBoardTree(), ["bool", "uint256", "uint8"]);

    try{
        switch(decision){
            case "validate":
                const shotsTaken = await contract.methods.GetShotsTaken(opponent).call();
                const all = [...Array.from({length: SIZE}, ((_,index) => index))];
                const { proof, proofFlags, leaves} = tree.getMultiProof(all.filter((i) => !shotsTaken.find((e) => parseInt(e.index) === i)));
                const board = [];
                const salts = [];
                const indexes = [];
                leaves.forEach((e)=>{
                    board.push(e[0]);
                    salts.push(e[1]);
                    indexes.push(e[2]);
                });
                console.log(board);
                console.log(salts);
                console.log(indexes);
                console.log("here");
                console.log(accounts[0]);
                console.log(tree);
                console.log("Proof");
                console.log(proof);
                console.log(proofFlags);

                await contract.methods.CheckBoard(proof,board,salts,proofFlags,indexes).send({from: accounts[0]});
                break;

            default:
                break;

        }
    }catch(error){
        console.log(error);
    }

    return null;

}

export const Win = () =>{
    const {state : {accounts}} = useEth();

    const {game, data: {
        winner, currentPhase,turn, player1, player2
    }} = useRouteLoaderData("game");

    console.log(currentPhase);

    const {setPop} = usePop();
    const navigate = useNavigate();

    const winnerLow = winner.toLowerCase();

    const opponent = accounts[0] === player1 ? player2 : player1;
    console.log(opponent);

    useEffect(() =>{
        (async() =>{
            game.events.WinnerVerified().on("data",(e) =>{
                console.log(e.returnValues._player);
                e.returnValues._player.toLowerCase() !== accounts[0] ?
                setPop("You have lost! Next time you'll be more lucky","error") :
                setPop("Congratulations, you have won! You can withdraw your prize","success");
                navigate(`/game/${game._address}/end`);
            })
        })();
    },[]);

    const View = () =>{
        return(
            <> 
                <div className="containerWin">
                    <h1 className="winnerTitle">The Winner is: {winner}</h1>
                    <div>
                        {accounts[0] !== winnerLow ? (
                            <h2 className="loserTitle">Waiting for the opponent to validate his board</h2>
                        ) : (
                            <Form method="post">
                                <input type="hidden" name ="address" value={game._address}></input>
                                <input type="hidden" name="decision" value="validate"></input>
                                <input type="hidden" name="opponent" value={opponent}></input>
                                <button type="submit" className="validateButton">VALIDATE YOUR BOARD</button>
                            </Form>
                        )}
                    </div>
                </div>
            </>
        )
    };

    return (
        <>
            {View()}
        </>

    );
};