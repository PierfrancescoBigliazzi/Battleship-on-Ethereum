import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Root } from "./components/Root";
import { Error } from "./components/Error";
import { Home, action as HomeAction } from "./components/Home";
import { Waiting, loader as WaitingLoader} from "./components/Game/Wait";
import { Game, loader as GameLoader, action as GameAction} from "./components/Game/Game";
import { Bet,  action as BetAction} from "./components/Game/Bet";
import { Fund, action as FundAction} from "./components/Game/Fund";
import { Place, action as PlaceAction} from "./components/Game/Place";
import { Shoot, loader as ShootLoader, action as ShootAction} from "./components/Game/Shoot";
import { Win, action as WinAction} from "./components/Game/Win";
import { End, action as EndAction} from "./components/Game/End";
import { useEth } from "./contexts/EthContext";
import { NavBarCustom } from "./components/Navbar";
import { AlertPopup } from "./components/Popup";

const myRouter = createBrowserRouter([
  {
    path: "/",
    element: ((<AlertPopup/>), (<Root />)),
    errorElement: <Error/>,
    children: [
      { path: "/home", element: <Home />, action: HomeAction},
      { path: "/wait/:address", element: <Waiting />, loader: WaitingLoader},
      {
        path: "/game/:address",
        element: <Game/>,
        loader: GameLoader,
        action: GameAction,
        id: "game",
        children: [
          {
            path: "/game/:address/bet",
            element: <Bet/>,
            action: BetAction
          },
          {
            path: "/game/:address/fund",
            element: <Fund/>,
            action: FundAction
          },
          {
            path: "/game/:address/place",
            element: <Place/>,
            action: PlaceAction
          },
          {
            path: "/game/:address/shoot",
            element: <Shoot/>,
            loader: ShootLoader,
            action: ShootAction
          },
          {
            path: "/game/:address/win",
            element: <Win/>,
            action: WinAction
          },
          {
            path: "/game/:address/end",
            element: <End/>,
            action: EndAction
          }
        ],
      },
    ],
  },
]);

const App = () => {
  const {
    state: { contract, accounts },
  } = useEth();


  useEffect(() => {}, [accounts]);

  return (
      //<Box>
          //{contract ? <RouterProvider router={myRouter} /> : null}
      //</Box>
      <div>
        <NavBarCustom/>
        <>
        {contract ? <RouterProvider router={myRouter} /> : null}
        </>
      </div>
  );
};

export default App;
