import React from "react";
import { useEth } from "../contexts/EthContext";
import "./Css/Navbar.css";

export const NavBarCustom = () =>{
    const {state: {accounts}} = useEth();

    const account = accounts ? (
        <span className = "identifier">Account: {accounts[0]}</span>
    ) : (
        <></>
    );

    return(
        <nav className="bar">
            <div className="topnav">
                <h1 className="title">Battleship</h1>
                <p className="account">{account}</p>
            </div>
        </nav>
    )
}