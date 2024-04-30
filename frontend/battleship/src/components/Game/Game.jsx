import React from "react";
import { useEffect } from "react";
import { useEth } from "../../contexts/EthContext";
import { usePop } from "../../contexts/PopupContext";
import { useLocation, redirect, useLoaderData, useNavigate, Form, Outlet } from "react-router-dom";
import { gameContract, isAFKAllowed, phaseToString, getWeb3Instance } from "../../utils";
import "../Css/Game.css";

export const loader = async ({params}) =>{
    try{
        const game = gameContract(params.address);
        const player1 = await game.methods.player1().call();
        const player2 = await game.methods.player2().call();
        const data = {
            player1,
            player2,
            currentPhase: await game.methods.currentPhase().call(),
            bet: await game.methods.bet().call(),
            turn: await game.methods.turn().call(),
            agreedBet: await game.methods.bet().call(),
            player1Bet: await game.methods.BetsProposed(player1).call(),
            player2Bet: await game.methods.BetsProposed(player2).call(),
            AFKplayer1: await game.methods.AFKplayer(player1).call(),
            AFKplayer2: await game.methods.AFKplayer(player2).call(),
            player1HasPaid: await game.methods.PlayerPaid(player1).call(),
            player2HasPaid: await game.methods.PlayerPaid(player2).call(),
            winner: await game.methods.winner().call()
        };
        //console.log("Game created");
        //console.log(data);
        return {game, data};
    }catch(error){
        console.log(error);
        return redirect("/home");
    }
};

export const action = async ({request}) =>{
    const form = await request.formData();
    const decision = form.get("decision");
    const address = form.get("address");
    const game = gameContract(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    const location = form.get("location");
    try{
        switch(decision){
            case "report":
                await game.methods.ReportAFK().send({from: accounts[0]});
                break;
            case "validate":
                await game.methods.VerifyAFK().send({from: accounts[0]});
                break;
            default:
                break;
        }
    }catch(error){
        console.log("An error occured in the game page: " + error);

    }
    return redirect(location);
};

export const Game = () =>{
    const {game, data:
        {
            player1,
            player2,
            currentPhase,
            bet,
            turn,
            AFKplayer1,
            AFKplayer2,
            winner
        }
    } = useLoaderData();

    const { state: {accounts}} = useEth();
    const navigate = useNavigate();
    const location = useLocation();
    const { setPop } = usePop();

    const opponent = accounts[0] === player1.toLowerCase() ? player2 : player1;

    const opponentAFK = opponent === player1 ? AFKplayer1 : AFKplayer2;

    useEffect(() =>{

        (async () =>{
            game.events.BetAgreed().on("data", (e) =>{
                console.log(e._bet);
                navigate(`/game/${game._address}/fund`);
                setPop("Both players agreed on the bet", "success");
            })
        })();

        (async () =>{
            game.events.BothPlayersPaid().on("data", (e) =>{
                console.log(e.returnValues._player1);
                console.log(e.returnValues._player2);
                navigate(`/game/${game._address}/place`);
                setPop("Now you can place your ships", "success");
            });
        })();

        (async () =>{
            game.events.BothPlayersPlacedShips().on("data", (e) =>{
                console.log(e.returnValues._player1);
                console.log(e.returnValues._player2);
                navigate(`/game/${game._address}/shoot`);
                setPop("Let's start the game", "success");
            });
        })();

        (async() =>{
            game.events.Winner().on("data", (e) =>{
                console.log(e.returnValues._player);
                navigate(`/game/${game._address}/win`);
                setPop("We have a winner!", "info");
            });
        })();

        (async() =>{
            game.events.AFKwarning().on("data", (e) =>{
                e.returnValues._player.toLowerCase() === accounts[0]
                ? setPop("You have been reported as AFK", "warning")
                : setPop("The opponent has been reported as AFK", "info");
            });
        })();

        (async() =>{
            game.events.NoMoreAFK().on("data", (e) =>{
                e.returnValues._player.toLowerCase() === accounts[0]
                ? setPop("You have been validated by the adversary as no more AFK", "info")
                : setPop("You validated the opponent as no more AFK", "info")
            })
        })();

    }, []);


    return(
        <>
            <div className ="game_box">
            <h1 className="game_id">Game: {game._address}</h1>
            <div id="opponent" className="game_id">Opponent: { opponent }</div>
            <div id="phase" className="game_id">Phase: {phaseToString(currentPhase)}</div>
            {bet !== "0" && <div className="game_id">{"Bet: " + bet + " wei"}</div>}
            {turn !== "0x0000000000000000000000000000000000000000" &&
            <div id="turn" className="game_id">{"Turn: " + turn}</div>}
            {opponentAFK === false && isAFKAllowed(currentPhase)
            && (
                <Form method="post" className="AFKform">
                    <input type="hidden" name = "decision" value="report"/>
                    <input type="hidden" name = "address" value={game._address}/>
                    <input type="hidden" name = "location" value = {location.pathname}/>
                    <button type="submit" className="AFKButton">REPORT</button>
                </Form> 
            )}
            {opponentAFK !== false && isAFKAllowed(currentPhase)
            && (
                <Form method="post" className="AFKform">
                    <input type="hidden" name = "decision" value="validate"/>
                    <input type="hidden" name = "address" value={game._address}/>
                    <input type="hidden" name = "location" value = {location.pathname}/>
                    <button type="submit" className="AFKButton">VALIDATE</button>
                </Form>
            )}
            </div>
            <Outlet/> 
        </>
    );
};