import { Alert } from '@mui/material';
import { usePop } from '../contexts/PopupContext';
import React from 'react';


// severity: error || warning || info || success
export const AlertPopup = () => {
  const { text, type } = usePop();

  if (text && type) {
    return (
      <Alert
        severity={type}
        variant="filled"
        sx={{
          display: 'flex',
          color: 'white',
          zIndex: 10,
          marginTop: '100px',
          top: 0,
          left: "40%",
          position: 'absolute',
          alignItems: 'center',
          textAlign: 'center',
          width: '300px'
        }}
      >
        {text}
      </Alert>
    );
  } else {
    return <></>;
  }
};

export default AlertPopup;