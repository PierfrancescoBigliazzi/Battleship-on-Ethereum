import React from "react";
import { useEffect } from "react";
import { useEth } from "../../contexts/EthContext";
import { useLocation, redirect, useLoaderData, useNavigate } from "react-router-dom";
import { gameContract } from "../../utils";
import { usePop } from "../../contexts/PopupContext";
import logo from '../../assets/ethereum-eth-logo.png';
import "../Css/Wait.css";

//Load the address of the game previously created
export const loader = ({params}) =>{
    //console.log(params);
    //console.log(params.address);
    try{
        const game = gameContract(params.address);
        console.log(params.address);
        return {game};
    }catch (error){
        console.log(error);
        //console.log(params.address);
        return redirect("/home");

    }
};

export const Waiting = () =>{
    const{
        state: {contract },
    } = useEth();

    const { game } = useLoaderData();
    const navigate = useNavigate();
    const location = useLocation();
    const { setPop } = usePop();

    useEffect(() =>{
        const JoinGame = (e) => {
            console.log(game);
            if (location.pathname !== "/home" || location.pathname !=="/") {
              navigate(`/game/${game._address}/bet`);
              setPop("Game joined!", "success");
            }
        };

        contract.events.JoinedGame({ filter: { _game: game._address}}).on("data",JoinGame);
    });

    const View = (
        <>
            <div className="WaitClass">
                <h1 className="TextWait">Waiting for another player!</h1>
                <input className="InputWait" type = "text" id="address" value= {game._address} readOnly/>
            </div>
        </>
    
    );
    
    return(
        <div>
          <img src={logo} alt="MerkEth Battleship Logo" style={{ width: "400px", height: "auto" }}/>
          {View}
        </div>
      );
};


