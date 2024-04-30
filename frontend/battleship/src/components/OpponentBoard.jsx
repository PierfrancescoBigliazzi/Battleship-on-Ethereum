import React, { useState, useEffect } from "react";
import {
    CELLS,
} from "../utils";
import "./Css/OpponentBoard.css";

export const OpponentBoard = ({shots,isPossibleToAttack, onSquareClick, BoardStateChanges}) =>{

    const [boardState, setBoardState] = useState(Array.from({length: CELLS}, () => Array(CELLS).fill(3)));

    const [squareState, setSquareState] = useState(null);

    useEffect(() => {
        const newBoardState = Array.from({length: CELLS}, () => Array(CELLS).fill(3));

        shots.forEach((shot) =>{
            const {index, state} = shot;
            const row = Math.floor(index / CELLS);
            const col = index % CELLS;

            let value = 3;
            
            //Miss
            if(state === "0"){
                value = 0;
            //Hit
            }else if(state === "1"){
                value = 1;
            //Taken
            }else if(state === "2"){
                value = 2;
            }


            newBoardState[row][col] = value;
        });

        setBoardState(newBoardState);
    },[shots]);

    useEffect(() =>{
        //Callback function BoardStateChanges updates the state of the board
        BoardStateChanges(boardState);
    },[boardState, BoardStateChanges]);

    const Axis = (type) =>{
        const getAxisLabels = (type) =>{
            switch(type){
                case "row":
                    return [" ","1","2","3","4","5","6","7","8"];
                case "column":
                    return ["A","B","C","D","E","F","G","H"];
                default:

            }
        };

        return(
            <div className={`Axis-${type}-OpponentBoard`}>
                {getAxisLabels(type).map((label,index) =>{
                    return <div className="axis-label-OpponentBoard" key={`axis-label-${label}`}>{label}</div>
                })}
            </div>
        );
    };

    const Table = () =>{
        const handleSquareClick = (rowIndex,colIndex) =>{
            setSquareState({rowIndex,colIndex});
            const index = rowIndex * CELLS + colIndex;
            const state = boardState[rowIndex][colIndex];
            onSquareClick(index, state);
        }

        return(
            <>
            <div className="containerOpponentBoard">
                {Axis("row")}
                {Axis("column")}
                <div className="shipsContainerOpponentBoard">
                    {boardState.map((row,rowIndex) => row.map((col,colIndex) =>(
                        <div key = {`${rowIndex}-${colIndex}`} className={col === 2 ? "shipSelected-OpponentBoard"
                        : col === 1 ? "shipHit-OpponentBoard"
                        : col === 0 ? "shipMiss-OpponentBoard"
                        : "none-OpponentBoard"} onClick={() => isPossibleToAttack ? handleSquareClick(rowIndex,colIndex) : null}
                        style = {{cursor: isPossibleToAttack ? "pointer" : "default"}}></div>
                    )))}
                </div>
            </div>
            </>
        );
    };

    const displayBoard = () =>{

        return(
            <>
                {Table()}
            </>
        )
    };

    return(
        <>
            {displayBoard()}
        </>
    )

};