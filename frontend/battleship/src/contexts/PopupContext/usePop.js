import { useContext } from 'react';
import { PopContext } from './PopupContext';

const usePop = () => useContext(PopContext);

export default usePop;