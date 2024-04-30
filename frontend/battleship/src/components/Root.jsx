import  ReactDOM  from "react-dom/client";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEth } from "../contexts/EthContext";
import { usePop } from "../contexts/PopupContext";
import { AlertPopup } from "./Popup.jsx";

export const Root = () =>{
    const location = useLocation();
    const navigate = useNavigate();
    const { setPop } = usePop();

    const { state: { contract, accounts}, } = useEth();

    useEffect(() =>{
        if(location.pathname === "/" || location.pathname === ""){
            navigate("/home");
        }
    }, [location.pathname, navigate]);

    useEffect(() =>{

        contract.events.GameCreated({filter:{owner: accounts[0]}}).on("data",(e) =>{
            console.log(e.returnValues._game);
            navigate(`/wait/${e.returnValues._game}`);
            setPop("Game created with success", "success");
        });

        contract.events.JoinedGame({filter: {player: accounts[0]}}).on("data",(e) =>{
            console.log(e.returnValues._game);
            navigate(`/game/${e.returnValues._game}/bet`);
        });

        contract.events.NoGameAvailable({filter: {player: accounts[0]}}).on("data", (e) =>{
            console.log(e.returnValues.player);
        });

        contract.events.NoValidGame({filter: {player: accounts[0]}}).on("data", (e) =>{
            console.log(e.returnValues.player);
        });


    },[]);

    return (
        <>
            <AlertPopup />         
            <Outlet />
        </>
    );
};

export default Root;