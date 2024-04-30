import { useEffect } from "react";
import { Form, useNavigate, useRouteLoaderData } from "react-router-dom";
import { useEth } from "../../contexts/EthContext";
import { usePop } from "../../contexts/PopupContext";
import { AlertPopup } from "../Popup.jsx";
import {
  gameContract,
  getWeb3Instance,
} from "../../utils";
import "../Css/Bet.css";

export const action = async({request}) =>{
    const form = await request.formData();
    const decision = form.get("decision");
    const address = form.get("address");
    const contract = gameContract(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    try {
        switch (decision) {
            case "accept":
                const betAccepted = form.get("betAmount");
                await contract.methods.BetAccepted(betAccepted).send({ from: accounts[0] });
                break;
            case "propose":
                const betProposed = form.get("betAmount");
                await contract.methods.BetAgreement(betProposed).send({ from: accounts[0] });
                break;
            default:
                break;
        }
    }catch (error) {
        console.log(error);
    }
    return null;
};

export const Bet = () =>{
    const { state: {accounts}} = useEth();
    const { setPop } = usePop();
    const {game, data:
        {
            player1,
            player2,
            bet,
            player1Bet,
            player2Bet
        }
    } = useRouteLoaderData("game");
    const navigate = useNavigate();

    const opponent = player1.toLowerCase() === accounts[0] ? player2 : player1;
    const opponentBet = player1.toLowerCase() === accounts[0] ? player2Bet : player1Bet;
    const yourBet = player1.toLowerCase() === accounts[0] ? player1Bet : player2Bet;

    useEffect(() =>{
        (async() =>{
            game.events.BetProposed({filter: opponent}).on("data", (e) =>{
                console.log(e.returnValues._proponent);
                navigate(`/game/${game._address}/bet`);
                setPop("Bet proposed", "info");
            })
        })();
    },[]);

    return(
        <>
            <div className="betDiv">
                <h2 className="text" id="proposal">Bet proposed: {opponentBet}</h2>
                <Form method="post">
                    <input type="hidden" name="address" value={game._address} />
                    <input type="hidden" name="decision" value="accept" />
                    <input type="hidden" name="betAmount" value={opponentBet} />
                    <button className="button-bet">Accept opponent proposal</button>
                </Form>
            </div>
            <div className="betDiv">
                <h2 className="text" id="acceptance">Your bet: {yourBet}</h2>
                <Form method="post">
                    <input type="hidden" name="address" value={game._address} />
                    <input type="hidden" name="decision" value="propose" />
                    <input type="number" name="betAmount" placeholder="Insert your bet" className="betNumber"/>
                    <button type="submit" className="button-bet">Propose your bet</button> 
                </Form>
            </div>
        </>
    );


};