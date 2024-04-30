import React, { useState, useEffect } from "react";
import {
    CELLS,
} from "../utils";
import "./Css/MyBoard.css"

export const MyBoard = ({board, shots, BoardStateChanges}) =>{

    //Map to each position in the board the presence of ship or not and the type of shot (Taken, Miss, Hit)
    const [boardState,setBoardState] = useState(Array.from({length: CELLS}, () => Array(CELLS).fill({ship: 0, shot: 0})));

    useEffect(() => {
        const boardArray = [];
        for(const key in board){
            const tmpArray = board[key];
            const value = tmpArray[0];
            const index = tmpArray[2];
            boardArray.push(value, index);
        }

        const newBoardState = Array.from({length: CELLS}, () => Array(CELLS).fill({ship: 0, shot: 3}));

        for(let i = 0; i < boardArray.length; i= i+2){
            const index = boardArray[i+1];
            const value = boardArray[i] === 0 ? 0 : 1;
            const row = Math.floor(index / CELLS);
            const col = index % CELLS;

            const square = {...newBoardState[row][col]};
            square.ship = value;
            newBoardState[row][col] = square;
        }

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

            const square = {...newBoardState[row][col]};
            square.shot = value;
            newBoardState[row][col] = square;
        });

        setBoardState(newBoardState);
    },[board,shots]);

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
            <div className={`Axis-${type}-MyBoard`}>
                {getAxisLabels(type).map((label,index) =>{
                    return <div className="axis-label-MyBoard" key={`axis-label-${label}`}>{label}</div>
                })}
            </div>
        );
    };

    const Table = () =>{

        return(
            <>
            <div className="containerMyBoard">
                {Axis("row")}
                {Axis("column")}
                <div className="shipsContainerMyBoard">
                    {boardState.map((row,rowIndex) => row.map((col,colIndex) =>(
                        <div key = {`${rowIndex}-${colIndex}`} className={col.ship === 1 && (col.shot === 3 || col.shot === 2) ? "shipPresent-MyBoard"
                        : col.ship === 1 && col.shot === 1 ? "shipHit-MyBoard"
                        : col.ship === 0 && col.shot === 0 ? "shipMiss-MyBoard"
                        : "none-MyBoard"}></div>
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

    return (
        <>
            {displayBoard()}
        </>
    )
};