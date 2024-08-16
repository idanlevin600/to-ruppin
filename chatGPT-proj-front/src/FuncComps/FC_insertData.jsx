import React, { useState, useEffect, useRef } from 'react';
import { Button, CircularProgress, Card, CardContent, Typography, Modal, Box, IconButton, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, TextField, Autocomplete } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Papa from 'papaparse';
import { convertToCSV, downloadCSV } from '../Util/csvUtils.js';
import InfoIcon from '@mui/icons-material/Info';
import { useCountUp } from 'use-count-up';
import styled from 'styled-components';
import DOMPurify from 'dompurify';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    maxHeight: '80%',
    bgcolor: '#333',
    color: '#fff',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    overflowY: 'auto',
};

const modalStyleData = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30%',
    maxHeight: '80%',
    bgcolor: '#333',
    color: '#fff',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    overflowY: 'auto',
  
    '@media (max-width: 1200px)': {
      width: '40%',
    },
    '@media (max-width: 900px)': {
      width: '50%',
    },
    '@media (max-width: 600px)': {
      width: '80%',
      maxHeight: '90%',
      p: 2,
    },
    '@media (max-width: 400px)': {
      width: '90%',
      p: 1,
    },
  };
  

const getBackgroundColor = (response) => {   
    const { result } = response;
    if (result === 'A+') return '#59ff4a';
    if (result === 'A') return '#8bc34a';
    if (result === 'B') return '#ffc107';
    if (result === 'D') return '#ff9800';
    if (result === 'F') return '#f74848';
    return '#fff';
};

const StyledButton = styled(Button)`
  && {
    background-color: #bb86fc;
    color: #121212;

    &:hover {
      background-color: #9c66d3;
      color: #ffffff;
    }

    &.Mui-disabled {
      background-color: #cccccc;
      color: #666666;
    }
  }
`;

const StyledFormControlModel = styled(FormControl)`
  min-width: 150px;
  margin-bottom: 10px;
  width: 30%;

  & .MuiInputLabel-root {
    color: #bb86fc;
  }

  & .MuiInputBase-root {
    color: #fff;
    border-color: #bb86fc !important;
  }

  & .MuiOutlinedInput-root {
    fieldset {
      border-color: #bb86fc;
    }

    &:hover fieldset {
      border-color: #bb86fc;
    }

    &.Mui-focused fieldset {
      border-color: #bb86fc;
    }
  }

  
`;

const StyledFormControl = styled(FormControl)`
  min-width: 200px;
  margin-bottom: 10px;
  width: 100%;

  & .MuiInputLabel-root {
    color: #bb86fc;
  }

  & .MuiInputBase-root {
    color: #fff;
    border-color: #bb86fc !important;
  }

  & .MuiOutlinedInput-root {
    fieldset {
      border-color: #bb86fc;
    }

    &:hover fieldset {
      border-color: #bb86fc;
    }

    &.Mui-focused fieldset {
      border-color: #bb86fc;
    }
  }

  @media (max-width: 600px) {
    & .MuiTextField-root, & .MuiAutocomplete-root, & .MuiDatePicker-root {
      margin-bottom: 10px;
      width: 100%;
    }
  }
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 1em;
`;
export default function FC_insertData() {
    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [responses, setResponses] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
    const [progress, setProgress] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [questionIdFilter, setQuestionIdFilter] = useState('');
    const [questionCreationDateFilter, setQuestionCreationDateFilter] = useState(null);
    const [tagFilter, setTagFilter] = useState('');
    const [uniqueTags, setUniqueTags] = useState([]);
    const isPausedRef = useRef(isPaused);
    const [lineLimit, setLineLimit] = useState('');

    const [totalLines, setTotalLines] = useState(0);
    const [chunks, setChunks] = useState(0);
    const [selectedChunk, setSelectedChunk] = useState(1);
    const linesPerChunk = 500;

    const { value: progressValue, reset: resetProgress } = useCountUp({
        isCounting: isSending && !isPaused,
        duration: 1,
        start: 0,
        end: progress,
    });
    

    useEffect(() => {
        const savedOriginalData = localStorage.getItem('originalData');
        const savedFilteredData = localStorage.getItem('filteredData');
        const savedIndex = localStorage.getItem('currentIndex');
        const savedChunk = localStorage.getItem('selectedChunk');
        if (savedOriginalData && savedFilteredData) {
            setOriginalData(JSON.parse(savedOriginalData));
            setFilteredData(JSON.parse(savedFilteredData));
            setShowContinueModal(true);
            setFileUploaded(true);
            setTotalLines(JSON.parse(savedOriginalData).length);
            setChunks(Math.ceil(JSON.parse(savedOriginalData).length / linesPerChunk));
        }
        if (savedIndex) {
            setCurrentIndex(parseInt(savedIndex, 10));
        }
        if (savedChunk) {
            setSelectedChunk(parseInt(savedChunk, 10));
        }
    }, []);

    useEffect(() => {
        if (originalData.length > 0) {
            extractUniqueTags(originalData);
        }
    }, [originalData]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                complete: (results) => {
                    const data = results.data.filter(row => Object.values(row).some(value => value !== null && value !== ''));
                    console.log("Filtered Data:", data);
                    setTotalLines(data.length);
                    setChunks(Math.ceil(data.length / linesPerChunk));
                    setOriginalData(data);
                    setFileUploaded(true);
                    setShowContinueModal(true);
                },
                header: true
            });
        }
    };

    const loadChunk = (chunkNumber) => {
        if (originalData.length === 0) return;
        const start = (chunkNumber - 1) * linesPerChunk;
        const end = start + linesPerChunk;
        const chunkData = originalData.slice(start, end);
        setFilteredData(chunkData);
        localStorage.setItem('filteredData', JSON.stringify(chunkData));
        localStorage.setItem('originalData', JSON.stringify(chunkData));
        localStorage.setItem('selectedChunk', chunkNumber);
        setSelectedChunk(chunkNumber);
    };

    const extractUniqueTags = (data) => {
        const allTags = data.reduce((acc, row) => {
            const tags = row.Tags ? row.Tags.match(/<([^>]+)>/g).map(tag => tag.replace(/<|>/g, '')) : [];
            return [...acc, ...tags];
        }, []);
        const uniqueTags = [...new Set(allTags)];
        setUniqueTags(uniqueTags);
    };

    const filterData = () => {
        const newOriginalData = JSON.parse(localStorage.getItem('originalData')) || [];
        const formattedDateFilter = questionCreationDateFilter ? questionCreationDateFilter.format('DD/MM/YYYY') : '';
        console.log("newOriginalData",newOriginalData)
        let filtered = newOriginalData.filter(row => {
            const questionIdMatch = questionIdFilter ? row.QuestionId.includes(questionIdFilter) : true;
            const dateMatch = formattedDateFilter ? dayjs(row.QuestionCreationDate, 'DD/MM/YYYY').isAfter(dayjs(formattedDateFilter, 'DD/MM/YYYY'), 'day') || dayjs(row.QuestionCreationDate, 'DD/MM/YYYY').isSame(dayjs(formattedDateFilter, 'DD/MM/YYYY'), 'day') : true;
            const tagMatch = tagFilter ? row.Tags.includes(`<${tagFilter}>`) : true;

            return questionIdMatch && dateMatch && tagMatch;
        });

        if (lineLimit) {
            filtered = filtered.slice(0, Number(lineLimit));
        }

        console.log(`Filtered Data with Question ID "${questionIdFilter}", Date "${formattedDateFilter}", Tag "${tagFilter}", Line Limit "${lineLimit}":`, filtered);

        setFilteredData(filtered);
        localStorage.setItem('filteredData', JSON.stringify(filtered));
    };

    const handleDateChange = (newValue) => {
        setQuestionCreationDateFilter(newValue);
    };

    const isValidResponseStructure = (response) => {
        const requiredKeys = [
            "questionId", "questionCreationDate", "model", "question", "answer1Id", "answer1", "answer2Id", "answer2", "answer3Id", 
            "answer3", "better_question", "why_better", "rating_Answer1", "explanation_for_rating1",
            "rating_Answer2", "explanation_for_rating2", "rating_Answer3", "explanation_for_rating3", "result", "tags"
        ];
        return requiredKeys.every(key => key in response);
    };

    const checkResponseExists = async (questionId, model) => {
        try {
            const response = await fetch('http://localhost:3000/check-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questionId, model }),
            });
            const jsonResponse = await response.json();
            console.log(`Check Response Exists: questionId=${questionId}, model=${model}, exists=${jsonResponse.exists}`);
            return jsonResponse.exists;
        } catch (error) {
            console.error('Error checking response:', error);
            return false;
        }
    };

    const handleSendData = async () => {
        setIsSending(true);
        for (let i = currentIndex; i < filteredData.length; i++) {
            if (isPausedRef.current) {
                setIsSending(false);
                setCurrentIndex(i);
                localStorage.setItem('currentIndex', i);
                return;
            }
            const data = filteredData[i];
            if (Object.keys(data).length === 0) continue;
            const exists = await checkResponseExists(data.QuestionId, selectedModel);
            if (exists) {
                console.log(`Response for QuestionId: ${data.QuestionId} and Model: ${selectedModel} already exists.`);
                setProgress(Math.round(((i + 1) / filteredData.length) * 100));
                continue;
            }
            let attempts = 0;
            let isValid = false;
            let response = null;
            while (!isValid && attempts < 3) {
                response = await sendData(data);
                attempts++;
                if (response !== null && isValidResponseStructure(response)) {
                    isValid = true;
                    setResponses(prevResponses => [...prevResponses, response]);
                    setProgress(Math.round(((i + 1) / filteredData.length) * 100));
                    setCurrentIndex(i + 1);
                    localStorage.setItem('currentIndex', i + 1);
                } else {
                    console.error('Invalid response structure:', response);
                }
            }
            if (!isValid) {
                console.error(`Failed to process data after 3 attempts:`, data);
            }
        }
        setIsSending(false);
        setSnackbarOpen(true);
    };

    const sendData = async (data) => {
        try {
            console.log("Sending data:", data);
            const response = await fetch('http://localhost:3000/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: data, model: selectedModel }),
            });
            const jsonResponse = await response.json();
            console.log("Received response:", jsonResponse);
            if (jsonResponse.error) {
                console.error('Error in response:', jsonResponse.error);
                return null;
            }
            return jsonResponse.completion;
        } catch (error) {
            console.error('Error sending data: ', error);
            return null;
        }
    };

    const handleDownloadCSV = () => {
        const csv = convertToCSV(responses);
        downloadCSV(csv, 'response_data.csv');
    };

    const handleOpenModal = (content) => {
        setModalContent(content);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setModalContent(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const handleContinue = () => {
        setShowContinueModal(false);
        loadChunk(selectedChunk);
    };

    const handleChangeFile = () => {
        localStorage.removeItem('originalData');
        localStorage.removeItem('filteredData');
        localStorage.removeItem('currentIndex');
        localStorage.removeItem('selectedChunk');
        setOriginalData([]);
        setFilteredData([]);
        setFileUploaded(false);
        setCurrentIndex(0);
        setShowContinueModal(false);
    };

    const handlePauseResume = () => {
        setIsPaused(prev => !prev);
        isPausedRef.current = !isPausedRef.current;
        if (isPausedRef.current === false && fileUploaded && !isSending) {
            handleSendData();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '20vh', backgroundColor: '#121212', color: '#fff' }}>
            <h1 style={{marginBottom:"1em"}}>Insert Data</h1>
            <StyledFormControlModel variant="outlined" style={{ marginBottom: '20px', minWidth: 120, color: '#fff' }}>
                <InputLabel id="select-model-label" style={{ color: '#bb86fc' }}>Model</InputLabel>
                <Select
                    labelId="select-model-label"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="Model"
                    style={{ color: '#fff', borderColor: '#bb86fc' }}
                >
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                </Select>
            </StyledFormControlModel>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <input
                    accept=".csv, .xml"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                    <StyledButton component="span" startIcon={<CloudUploadIcon />}>
                        Upload
                    </StyledButton>
                </label>
                {fileUploaded && <CheckCircleIcon color="success" style={{ marginLeft: 10 }} />}
                <div>{fileUploaded && <Typography style={{ marginLeft: 20, color: '#fff' }}>{`File detected with ${totalLines} lines.`}</Typography>}</div>
            </div>

            {fileUploaded && (
                <div style={{ backgroundColor: '#121212', padding: '20px', borderRadius: '8px' }}>
                <Typography variant="body1" style={{ color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>
                  Select a chunk to process:
                </Typography>
                <Select
                  value={selectedChunk}
                  onChange={(e) => loadChunk(e.target.value)}
                  style={{ margin: '10px 0', color: '#fff', backgroundColor: '#333', width: '100%' }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#bb86fc',
                      },
                      '&:hover fieldset': {
                        borderColor: '#bb86fc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#bb86fc',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: '#bb86fc',
                    },
                    '& .MuiMenu-paper': {
                      backgroundColor: '#333',
                      color: '#fff',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        backgroundColor: '#333',
                        color: '#fff',
                      },
                    },
                  }}
                >
                  {Array.from({ length: chunks }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1} style={{ backgroundColor: '#333', color: '#fff' }}>
                      Chunk {i + 1} ({i * linesPerChunk + 1} - {(i + 1) * linesPerChunk})
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body2" style={{ color: '#fff', marginTop: '10px' }}>
                  Currently processing chunk {selectedChunk}, which contains lines {(selectedChunk - 1) * linesPerChunk + 1} to {Math.min(selectedChunk * linesPerChunk, totalLines)}.
                </Typography>
              </div>
              
              
            )}

            <StyledFormControl>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            }}>
                <TextField
                label="Question ID Filter"
                variant="outlined"
                value={questionIdFilter}
                onChange={(e) => setQuestionIdFilter(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
                InputLabelProps={{ style: { color: '#bb86fc' } }}
                InputProps={{ style: { color: '#fff', borderColor: '#bb86fc' } }}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    label="Date Filter"
                    value={questionCreationDateFilter}
                    onChange={handleDateChange}
                    format='DD/MM/YYYY'
                    renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        style={{ flex: 1, minWidth: '200px' }}
                        InputLabelProps={{ style: { color: '#bb86fc' } }}
                        InputProps={{
                        ...params.InputProps,
                        style: { color: '#fff', borderColor: '#bb86fc' },
                        }}
                    />
                    )}
                />
                </LocalizationProvider>
                <Autocomplete
                options={uniqueTags}
                value={tagFilter}
                onChange={(event, newValue) => setTagFilter(newValue)}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Tag Filter"
                    variant="outlined"
                    style={{ flex: 1, minWidth: '200px' }}
                    InputLabelProps={{ style: { color: '#bb86fc' } }}
                    InputProps={{
                        ...params.InputProps,
                        style: { color: '#fff', borderColor: '#bb86fc' }
                    }}
                    />
                )}
                />
                <TextField
                label="Line Limit"
                variant="outlined"
                value={lineLimit}
                onChange={(e) => setLineLimit(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
                InputLabelProps={{ style: { color: '#bb86fc' } }}
                InputProps={{ style: { color: '#fff', borderColor: '#bb86fc' } }}
                />
            </div>
            <ButtonContainer>
                <StyledButton onClick={filterData}>
                Apply Filters
                </StyledButton>
            </ButtonContainer>
            </StyledFormControl>    

            {!isSending && !isPaused && (
                <StyledButton onClick={handleSendData} disabled={!fileUploaded || isSending}>
                    Send
                </StyledButton>
            )}
            {(isSending || isPaused) && (
                <div style={{ marginTop: '20px', position: 'relative', textAlign: 'center' }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                        <Typography style={{ color: 'white' }} variant="h6" component="div" color="textSecondary" gutterBottom>
                            {isPaused ? 'Paused' : 'Uploading'}
                        </Typography>
                        <StyledButton onClick={handlePauseResume}>
                            {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                        </StyledButton>
                    </Box>
                    <Box position="relative" display="inline-flex">
                        <CircularProgress size={100} variant="determinate" value={progress} />
                        <Box
                            top={0}
                            left={0}
                            bottom={0}
                            right={0}
                            position="absolute"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Typography style={{ color: 'white' }} variant="h6" component="div" color="textSecondary">
                                {progressValue}%
                            </Typography>
                        </Box>
                    </Box>
                </div>
            )}
            <div style={{ width: '80%', marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {responses.map((response, index) => (
                    <Card key={index} style={{ margin: '10px', minWidth: '300px', maxWidth: '300px', flex: '1', position: 'relative', backgroundColor: getBackgroundColor(response) }}>
                        <CardContent>
                            <Typography variant="h6" style={{ color: '#121212' }}>Response {index + 1}</Typography>
                            {['questionId', 'rating_Answer1', 'rating_Answer2', 'rating_Answer3'].map((key) => (
                                <Typography key={key} variant="body2" style={{ color: '#121212' }}><strong>{key}:</strong> {response[key]}</Typography>
                            ))}
                            <IconButton
                                onClick={() => handleOpenModal(response)}
                                style={{ position: 'absolute', top: 10, right: 10 }}
                            >
                                <InfoIcon />
                            </IconButton>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {responses.length > 0 && (
                <StyledButton onClick={handleDownloadCSV} style={{ marginTop: '20px' }}>
                    Download CSV
                </StyledButton>
            )}
            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-title" variant="h6" component="h2">
                        Detailed Response
                    </Typography>
                    {modalContent && Object.entries(modalContent).map(([key, value]) => (
                        <Typography key={key} id="modal-description" sx={{ mt: 2 }}>
                            <strong>{key}:</strong> <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }} />
                        </Typography>
                    ))}
                </Box>
            </Modal>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Data processing completed!
                </Alert>
            </Snackbar>
            <Modal
                open={showContinueModal}
                onClose={() => setShowContinueModal(false)}
                aria-labelledby="continue-modal-title"
                aria-describedby="continue-modal-description"
            >
                <Box sx={modalStyleData}>
                    <Typography id="continue-modal-title" variant="h6" component="h2">
                        Select a Chunk
                    </Typography>
                    <Typography id="continue-modal-description" sx={{ mt: 2 }}>
                        Choose a chunk of the data to load into the application for processing.
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Array.from({ length: chunks }, (_, i) => (
                            <StyledButton key={i + 1} onClick={() => loadChunk(i + 1)}>
                                Load Chunk {i + 1} ({i * linesPerChunk + 1} - {Math.min((i + 1) * linesPerChunk, totalLines)})
                            </StyledButton>
                        ))}
                        <StyledButton onClick={handleChangeFile} style={{ backgroundColor: '#f44336', color: '#121212' }}>
                            Upload New File
                        </StyledButton>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}
