import React, { useEffect, useState } from "react";
import {
    CELLS,
    SHIPS,
} from "../utils";
import "./Css/Board.css";

export const Board = ({changeOnBoard}) =>{
    const [boardState, setBoardState] = useState(Array.from({length: CELLS}, () => Array(CELLS).fill(0)));

    const handleClick = (i,j) =>{
        const newBoardState = [...boardState];
        const currentCellState = newBoardState[i][j];

        if(currentCellState === 0){
            const shipsPlaced = newBoardState.flat().filter((value) => value === 1).length;
            if(shipsPlaced >= SHIPS){
                return;
            }
            newBoardState[i][j] = 1;
        }else{
            newBoardState[i][j] = 0;
        }

        setBoardState(newBoardState);
    }

    useEffect(() =>{
        changeOnBoard(boardState);
    }, [boardState, setBoardState]);

    const shipsPlaced = boardState.flat().filter((value) => value === 1).length;

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
            <div className={`Axis-${type}`}>
                {getAxisLabels(type).map((label,index) =>{
                    return <div className="axis-label" key={`axis-label-${label}`}>{label}</div>
                })}
            </div>
        );
    };

    const Table = () =>{

        return(
            <>
            <div className="containerBoard">
                {Axis("row")}
                {Axis("column")}
                <div className="shipsContainer">
                    {boardState.map((row,rowIndex) => row.map((_,colIndex) =>(
                        <div key = {`${rowIndex}-${colIndex}`} className={boardState[rowIndex][colIndex] ? "selected" : "cell"}  onClick={() => handleClick(rowIndex,colIndex)}></div>
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
            <div className="Ships">Remaining ships: {SHIPS - shipsPlaced} </div> 
        </>
    );
};