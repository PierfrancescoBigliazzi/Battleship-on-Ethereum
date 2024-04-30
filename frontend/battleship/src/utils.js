import Web3 from "web3";
import localforage from "localforage";

export const getWeb3Instance = () => {
  return new Web3(Web3.givenProvider || "ws://127.0.0.1:8545");
};

export const gameContract = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./contracts/Game.json");
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

export const gamesManagerContract = (address) => {
  const web3 = getWeb3Instance();
  const { abi } = require("./contracts/GamesManager.json");
  const contract = new web3.eth.Contract(abi, address, {dataInputFill: 'data'});
  return contract;
};

export const CELLS = 8;
export const SIZE = CELLS*CELLS;
export const SHIPS = 5;


export const Phase = {
  InitialPhase: "0",
  BetPhase: "1",
  PlacementPhase: "2",
  ShootingPhase: "3",
  WinningPhase: "4",
  EndPhase: "5",
};

export const ShotType = {
  Taken: "2",
  Hit: "1",
  Miss: "0",
};

export function indexToCoordinate(size, index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = [...Array(size).keys()].map((num) => (num + 1).toString());

  const row = alphabet[Math.floor(index / size)];
  const column = (index % size) +1;

  return "(" + row + ", " + column.toString() +")";
}

export const phaseToString = (phase) => {
  switch (phase) {
    case Phase.InitialPhase:
      return "Start the game";
    case Phase.BetPhase:
      return "Bet phase";
    case Phase.PlacementPhase:
      return "Placement phase";
    case Phase.ShootingPhase:
      return "Shoot phase";
    case Phase.WinningPhase:
      return "Winning phase";
    case Phase.EndPhase:
      return "End of the game.";
    default:
      throw new Error("Invalid phase");
  }
};

export const indexToLetter = (index) =>{
  switch(index) {
      case 0:
          return "A";
      case 1:
          return "B";
      case 2: 
          return "C";
      case 3:
          return "D";
      case 4:
          return "E";
      case 5:
          return "F";
      case 6:
          return "G";
      case 7:
          return "H";
      default:
          return;
  }
};

export const isAFKAllowed = (phase) => {
  return (
    phase !== Phase.InitialPhase &&
    phase !== Phase.EndPhase
  );
};

export const rndNonce = () => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);

  // Convert byte array to hexadecimal representation
  const bytesHex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // Convert hexadecimal value to a decimal string
  return window.BigInt("0x" + bytesHex).toString(10);
};

//localforage is a javascript library that allows us to store in an asynchronous way 
//the board configuration and the Merkle tree in a local storage

export const saveBoardTree = async (tree) => {
  await localforage.setItem("tree", tree);
};

export const loadBoardTree = async () => {
  return await localforage.getItem("tree");
};

export const saveBoard = async (board) => {
  await localforage.setItem("board", board);
};

export const loadBoard = async () => {
  return await localforage.getItem("board");
};