import {
    Form,
    useRouteLoaderData,
    useLoaderData,
    useNavigate,
  } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { usePop } from "../../contexts/PopupContext";
import { useEth } from "../../contexts/EthContext";
import {
    getWeb3Instance,
    gameContract,
    indexToCoordinate,
    ShotType,
    loadBoardTree,
    loadBoard,
    CELLS
} from "./../../utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { MyBoard } from "../MyBoard";
import { OpponentBoard } from "../OpponentBoard";
import "../Css/Shoot.css"

export const loader =  async ({params}) =>{
    try{
        const board = await loadBoard();
        const game = gameContract(params.address);
        const player1 = await game.methods.player1().call();
        const player2 = await game.methods.player2().call();
        const player1Shots = await game.methods.GetShotsTaken(player1).call();
        const player2Shots = await game.methods.GetShotsTaken(player2).call();
        return{
            board,
            data: {player1Shots, player2Shots}
        };
    }catch(error){
        console.log(error);
    }
}

export const action = async ({request}) =>{
    const form = await request.formData();
    const address = form.get("address");
    const decision = form.get("decision");
    const contract = gameContract(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    const pos = parseInt(form.get("index"));
    try{
        switch(decision){
            case "attack":
                await contract.methods.FirstAttack(pos).send({from: accounts[0]});
                break;
            
            case "checkAndAttack":
                const tree = StandardMerkleTree.load(await loadBoardTree());
                const checkPos = parseInt(form.get("checkIndex"));
                const value = tree.values.find((v) => v.value[2] === checkPos).value;
                const proof = tree.getProof(checkPos);

                await contract.methods.CounterAttack(value[2],value[1],value[0],proof,pos).send({from: accounts[0]});

                break;
            default:
                break;
        }
    }catch(error){
        console.log(error);
    }
    return null;

}

export const Shoot = () =>{

    const {state: {accounts}} = useEth();

    const {game, data : {
        player1,
        player2,
        turn
    }} = useRouteLoaderData("game");

    const {board, data: {
        player1Shots,
        player2Shots
    }} = useLoaderData();

    const opponent = accounts[0] === player1.toLowerCase() ? player2 : player1;

    const myShots = accounts[0] === player1.toLowerCase() ? player1Shots: player2Shots;

    const opponentShots = accounts[0] === player1.toLowerCase() ? player2Shots: player1Shots;

    const navigate = useNavigate();

    const {setPop} = usePop();

    const size = CELLS;

    const isPossible = accounts[0] === turn.toLowerCase() ? 1 : 0;
    
    //Define a state and an update state function to store the shots of the game
    const [shotIndex, setShotIndex] = useState([]);

    //Define a state and an update state function to store the board of the player
    const [myBoardState, setMyBoardState] = useState([]);

    //Define a state and an update state function to store the board of the adversary
    const [opponentBoardState, setOpponentBoardState] = useState([]);

    const shotToCheck = opponentShots.filter((e) => e.state === ShotType.Taken);
    console.log("Opponent shots to check");
    console.log(shotToCheck);
    console.log(opponentShots);
    console.log(player2Shots);

    //Callback function to handle shot index changes
    const ShotIndexChange = (newIndex) =>{
        setShotIndex(newIndex);
    };

    //Callback function to handle changes on my board
    const myBoardChange = (newState) =>{
        setMyBoardState(newState);
    };

    //Callback function to handle changes on opponent's board
    const opponentBoardChange = (newState) =>{
        setOpponentBoardState(newState);
    };

    const SelectCell = (index, state) =>{
        console.log("Selected cell:")
        console.log(index, state);

        if(state !== 3){
            setPop("You already selected that cell","error");
        }else{
            ShotIndexChange(index);
        }
    };

    useEffect(() =>{
        (async() =>{
            game.events.ShotTaken({filter: {_player: opponent}}).on("data",(e) =>{
                console.log(e.returnValues._player);
                console.log(e.returnValues._index);
                accounts[0] !== turn.toLowerCase() ? 
                setPop("Opponent took a shot, now it's your turn", "warning"):
                setPop("You took a shot, now it's opponent's turn","info");
                navigate(`/game/${game._address}/shoot`);
            })
        })();
    });

    return (
        <>
            <h1 className="myBoardTitle">MY BOARD</h1>
            <MyBoard board={board} shots={opponentShots} BoardStateChanges={myBoardChange}></MyBoard>
            <h1 className="opponentBoardTitle">OPPONENT BOARD</h1>
            <OpponentBoard shots={myShots} isPossibleToAttack={isPossible} onSquareClick={SelectCell} BoardStateChanges={opponentBoardChange}></OpponentBoard>
            {turn.toLowerCase() === accounts[0] ? (
                <div className="containerShot">
                <h3 className="coordinate">CELL : {indexToCoordinate(size,shotIndex)}</h3>
                {opponentShots.length === 0 ? (
                    <Form method="post">
                        <input type="hidden" name = "address" value={game._address}></input>
                        <input type="hidden" name = "decision" value = "attack"></input>
                        <input type="hidden" name = "index" value= {shotIndex}></input>
                        <button type="submit" className="shotButton">SHOT</button>
                    </Form>
                ) : (
                    <Form method="post">
                        <input type="hidden" name = "address" value={game._address}></input>
                        <input type="hidden" name = "decision" value = "checkAndAttack"></input>
                        <input type="hidden" name = "index" value= {shotIndex}></input>
                        <input type="hidden" name ="checkIndex" value={shotToCheck[0].index}></input> 
                        <button type="submit" className="shotButton">SHOT</button>
                    </Form>
                )}
                </div>
            ) : (
                <></>
            )}
        </>
    );

    


}