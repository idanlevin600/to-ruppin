// src/App.jsx

import { useState } from 'react';
import './App.css';


import FC_ResponsesTable from './FuncComps/FC_ResponsesTable';
import FC_insertData from './FuncComps/FC_insertData';
import FC_previousResults from './FuncComps/FC_previousResults';
import FC_statistics from './FuncComps/FC_statistics';
import { Button, Box, AppBar, Toolbar } from '@mui/material';
import { styled } from '@mui/system';

const NavButton = styled(Button)(({ theme }) => ({
  color: 'white',
  '&:hover': {
    color: '#ff4081', // Pink color on hover
    backgroundColor: 'transparent', // Remove background on hover
  },
  '&.active': {
    color: '#ff4081', // Pink color when active
  },
  borderBottom: 'none', // Remove bottom border
  borderRadius: 0, // Remove border radius for uniformity
  margin: '0 15px', // Add space between buttons
  border: 'none', // Remove the white border
}));

function App() {
  const [currentPage, setCurrentPage] = useState('insertData');

  const handleSwitchChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#000' }}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          {/* <NavButton
            className={currentPage === 'previousResults' ? 'active' : ''}
            onClick={() => handleSwitchChange('previousResults')}
          >
            Previous Results
          </NavButton> */}
          <NavButton
            className={currentPage === 'insertData' ? 'active' : ''}
            onClick={() => handleSwitchChange('insertData')}
          >
            Insert Data
          </NavButton>
          <NavButton
            className={currentPage === 'statistics' ? 'active' : ''}
            onClick={() => handleSwitchChange('statistics')}
          >
            Statistics
          </NavButton>
          <NavButton
            className={currentPage === 'responsesTable' ? 'active' : ''}
            onClick={() => handleSwitchChange('responsesTable')}
          >
            Responses Table
          </NavButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '0 2em' }}>
        {currentPage === 'insertData' && <FC_insertData />}
        {/* {currentPage === 'previousResults' && <FC_previousResults />} */}
        {currentPage === 'statistics' && <FC_statistics />}
        {currentPage === 'responsesTable' && <FC_ResponsesTable />}
      </Box>
    </>
  );
}

export default App;
