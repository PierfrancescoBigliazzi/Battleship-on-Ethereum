import { Form, useRouteLoaderData } from "react-router-dom";
import { useEth } from "../../contexts/EthContext";
import {
  gameContract,
  getWeb3Instance,
} from "../../utils";
import "../Css/Fund.css";

export const action = async({request}) =>{
    const form = await request.formData();
    const address = form.get("address");
    const betAmount = form.get("betAmount");
    const contract = gameContract(address);
    const accounts = await getWeb3Instance().eth.getAccounts();
    try{
        await contract.methods.BetDeposited().send({from: accounts[0], value: betAmount});
    }catch(error){
        console.log(error);
    }

    return null;
};

export const Fund = () =>{
    const { state: {accounts}} = useEth();
    const { game, data:
        {
            player1,
            player2,
            bet,
            player1HasPaid,
            player2HasPaid
        }
    } = useRouteLoaderData("game");

    return(
        <>
            <div className="fundDiv">
                <h2 className="text" id="betAgreed">Bet agreed: {bet} wei</h2>
                {(accounts[0] === player1.toLowerCase() && player1HasPaid && !player2HasPaid) ||
                (accounts[0] === player2.toLowerCase() && player2HasPaid && !player1HasPaid) ? (
                    <h2 className="text">Waiting for the opponent to pay</h2>
                ) : (
                    <Form method = "post">
                        <input type="hidden" name="address" value={game._address} />
                        <input type="hidden" name="betAmount"  value={bet} />
                        <button type = "submit" className="button-fund">Deposit funds</button>
                    </Form>
                )}
            </div>
        </>
    )
};