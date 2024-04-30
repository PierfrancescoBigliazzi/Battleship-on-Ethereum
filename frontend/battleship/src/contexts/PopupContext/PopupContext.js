import { createContext, useState } from "react";
import { InitialState } from  "./state";


const ALERT_TIME = 3000;

export const PopContext = createContext({
    ...InitialState,
    setPop: () => {}
});

export const PopProvider = ({children}) => {
    const [alert, setPop] = useState(InitialState);

    const showPop = (text,type) =>{
        setPop({text,type});

        setTimeout(() =>{
            setPop(InitialState);
        }, ALERT_TIME);
    };

    return(
        <PopContext.Provider value={{...alert, setPop: showPop}}>
            {children}
        </PopContext.Provider>
    );
};







