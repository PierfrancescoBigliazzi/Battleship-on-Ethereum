const actions = {
    init: "INIT"
};

const InitialState = {
  artifact: null,
  web3: null,
  accounts: null,
  networkID: null,
  contract: null
};

//The reducer function specifies how the state will be udpated
//In our case state will be initialState at the beginning and action will be init:INIT
const reducer = (state, action) => {
  const { type, data } = action;
  switch (type) {
    case actions.init:
      return { ...state, ...data };
    default:
      throw new Error("Undefined reducer action type");
  }
};
  
export { actions, InitialState, reducer };