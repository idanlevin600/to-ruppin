import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MUIDataTable from "mui-datatables";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DOMPurify from 'dompurify';
import '../index.css';

dayjs.extend(customParseFormat);

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxHeight: '80%',
  bgcolor: '#333',
  color: '#fff',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
};

export default function FC_ResponsesTable() {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [tagsList, setTagsList] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);


  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/results');
      const processedResults = response.data.map(item => ({
        ...item,
        tags: item.tags ? (item.tags.match(/<[^>]+>/g) || []).map(tag => tag.replace(/[<>]/g, '')) : []
      }));
      setResults(processedResults);
      extractUniqueTags(processedResults);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };
  
  

  const extractUniqueTags = (data) => {
    const allTags = data.reduce((acc, curr) => {
      if (curr.tags) {
        acc.push(...curr.tags);
      }
      return acc;
    }, []);
    const uniqueTags = Array.from(new Set(allTags));
    setTagsList(uniqueTags);
  };

  const handleOpenDeleteModal = (questionId) => {
    setDeleteId(questionId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/delete/${deleteId}`);
      setResults(results.filter(result => result.questionId !== deleteId));
      setDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
    

  const handleOpen = (serialNumber) => {
    // Find the data by serial number
    const data = results.find(item => item.id === serialNumber);
    setSelectedData(data);
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setSelectedData(null);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/delete/${questionId}`);
      setResults(results.filter(result => result.questionId !== questionId));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString) => {
    return dayjs(dateString, 'DD/MM/YYYY');
  };

  const renderValue = (key, value) => {
    if (key === 'tags') {
      return value.join(', ');
    } else if (typeof value === 'string' && dayjs(value, 'DD/MM/YYYY', true).isValid()) {
      return <span>{formatDate(value)}</span>;
    } else if (typeof value === 'number') {
      return <span>{value}</span>;
    } else {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(String(value)),
          }}
        />
      );
    }
  };

  const columns = [
    {
      name: 'id',
      label: 'Serial Number',
      options: {
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'result',
      label: 'Result',
      options: {
        customBodyRender: (value) => (
          <p className={`capitalize px-3 py-1 inline-block rounded-full text-center ${
              value === "A+" ? "bg-lime-500" :
              value === "A" ? "bg-green-400" : 
              value === "B" ? "bg-yellow-400" :
              value === "D" ? "bg-amber-500" : "bg-rose-500"
          }`}>
            {value}
          </p>
        ),
        setCellProps: () => ({ style: { textAlign: 'center' } })
      },
    },
    {
      name: 'questionId',
      label: 'Question Id',
      options: {
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'questionCreationDate',
      label: 'Question Creation Date',
      options: {
        filter: true,
        filterType: 'custom',
        customFilterListOptions: {
          render: (v) => {
            if (v[0] && v[1]) {
              return `Start Date: ${dayjs(v[0]).isValid() ? dayjs(v[0]).format('DD/MM/YYYY') : ''}, End Date: ${dayjs(v[1]).isValid() ? dayjs(v[1]).format('DD/MM/YYYY') : ''}`;
            } else if (v[0]) {
              return `Start Date: ${dayjs(v[0]).isValid() ? dayjs(v[0]).format('DD/MM/YYYY') : ''}`;
            } else if (v[1]) {
              return `End Date: ${dayjs(v[1]).isValid() ? dayjs(v[1]).format('DD/MM/YYYY') : ''}`;
            }
            return false;
          }
        },
        filterOptions: {
          logic: (date, filters) => {
            const [start, end] = filters.map(f => f ? parseDate(f) : null);
            const dayjsDate = parseDate(date);
            if (start && end) {
              return !dayjsDate.isBetween(start, end, null, '[]');
            } else if (start) {
              return !dayjsDate.isAfter(start, 'day');
            } else if (end) {
              return !dayjsDate.isBefore(end, 'day');
            }
            return false;
          },
          display: (filterList, onChange, index, column) => (
            <div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={filterList[index][0] ? dayjs(filterList[index][0], 'DD/MM/YYYY') : null}
                  onChange={(newValue) => {
                    filterList[index][0] = newValue ? newValue.format('DD/MM/YYYY') : null;
                    onChange(filterList[index], index, column);
                  }}
                  renderInput={(params) => <input {...params} />}
                />
                <DatePicker
                  label="End Date"
                  value={filterList[index][1] ? dayjs(filterList[index][1], 'DD/MM/YYYY') : null}
                  onChange={(newValue) => {
                    filterList[index][1] = newValue ? newValue.format('DD/MM/YYYY') : null;
                    onChange(filterList[index], index, column);
                  }}
                  renderInput={(params) => <input {...params} />}
                />
              </LocalizationProvider>
            </div>
          ),
        },
        customBodyRender: (value) => formatDate(value),
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'ratingAnswer1',
      label: 'Rating Answer 1',
      options: {
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'ratingAnswer2',
      label: 'Rating Answer 2',
      options: {
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'ratingAnswer3',
      label: 'Rating Answer 3',
      options: {
        setCellProps: () => ({ style: { textAlign: 'center' } })
      }
    },
    {
      name: 'tags',
      label: 'Tags',
      options: {
        filter: true,
        display: 'false',
        filterType: 'multiselect',
        filterOptions: {
          names: tagsList,
          logic: (value, filters) => {
            if (filters.length === 0) return false;
            return !filters.some(filter => value.includes(filter));
          }
        },
        customBodyRender: (value) => value.join(', '),
        setCellProps: () => ({ style: { textAlign: 'center' } }),
      }
    },
    {
      name: '',
      label: 'Info',
      options: {
        customBodyRender: (value, tableMeta) => {
          const serialNumber = tableMeta.rowData[0]; // Assuming the first column is the serial number
          return (
            <button
              className="bg-blue-400 rounded-full px-3 py-1"
              onClick={() => handleOpen(serialNumber)}
            >
              <svg className="h-6 w-6 text-neutral-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          );
        },
        setCellProps: () => ({ style: { textAlign: 'center' } }),
        filter: false,
      },
    },   
    {
      name: 'delete',
      label: 'Delete',
      options: {
        customBodyRender: (value, tableMeta) => (
          <button
            className="bg-red-400 rounded-full px-3 py-1"
            onClick={() => handleOpenDeleteModal(results[tableMeta.rowIndex].questionId)}
          >
            <svg className="h-6 w-6 text-neutral-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ),
        setCellProps: () => ({ style: { textAlign: 'center' } }),
        filter: false,
      }
    }
    
  ];

  const options = {
    selectableRows: false,
    elevation: 0,
    responsive: "standard", // Correct responsive option
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20, 30],
    filter: true,
    onTableChange: (action, tableState) => {
      if (action === 'filterChange') {
        // Additional logic if needed when filters change
      }
    },
    setTableProps: () => ({
      size: 'small', // Reduces the height of table rows
    }),
    setRowProps: (row) => ({
      style: { padding: '4px' } // Reduces the padding for rows
    }),
  };
  
  
  const getMuiTheme = () => createTheme({
    typography: {
      fontFamily: "Poppins",
    },
    palette: {
      background: {
        paper: "#1e293b",
        default: "#0f172a"
      },
      mode: "dark",
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: {
            padding: "10px 4px",
            textAlign: 'center'
          },
          body: {
            
            padding: "15px", // Reduce padding for mobile screens
            color: "#e2e8f0",
            textAlign: 'center'
          },
        }
      }
    }
  });
  

  return (
    <div>
      <h1 style={{marginBottom:"1em"}}>Responses Table</h1>
      
      <ThemeProvider theme={getMuiTheme()}>
        <MUIDataTable
          title={"Previous Responses List"}
          data={results}
          columns={columns}
          options={options}
        />
      </ThemeProvider>


      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={modalStyle}>
          {selectedData ? (
            <>
              <Typography id="modal-title" variant="h6" component="h2" sx={{ fontFamily: 'Poppins' }}>
                Details
              </Typography>
              {selectedData && Object.entries(selectedData).map(([key, value]) => (
                <Typography key={key} id="modal-description" sx={{ mt: 2, fontFamily: 'Poppins' }}>
                  <strong>{key}:</strong> {renderValue(key, value)}
                </Typography>
              ))}
            </>
          ) : (
            <Typography id="modal-description" sx={{ mt: 2 }}>
              No data available.
            </Typography>
          )}
        </Box>
      </Modal>
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        <Box sx={{ ...modalStyle, maxWidth: 400, textAlign: 'center' }}>
          <Typography id="delete-modal-title" variant="h6" component="h2" sx={{ fontFamily: 'Poppins', mb: 2 }}>
            Confirm Delete
          </Typography>
          <Typography id="delete-modal-description" sx={{ fontFamily: 'Poppins', mb: 3 }}>
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={confirmDelete}
            >
              Delete
            </button>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Box>
      </Modal>

    </div>
  );
}
