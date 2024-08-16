import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, useMediaQuery } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const FC_statistics = () => {
  const [data, setData] = useState({
    labels: [],
    datasets: [],
  });
  const [pieData, setPieData] = useState(null);
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/results');
      const results = response.data;

      const summaryData = {
        'gpt-3.5-turbo': { A_plus: 0, A: 0, B: 0, D: 0, F: 0 },
        'gpt-4': { A_plus: 0, A: 0, B: 0, D: 0, F: 0 },
      };

      results.forEach(result => {
        if (result.model in summaryData) {
          switch(result.result) {
            case 'A+':
              summaryData[result.model].A_plus++;
              break;
            case 'A':
              summaryData[result.model].A++;
              break;
            case 'B':
              summaryData[result.model].B++;
              break;
            case 'D':
              summaryData[result.model].D++;
              break;
            case 'F':
              summaryData[result.model].F++;
              break;
            default:
              break;
          }
        }
      });

      setData({
        labels: ['gpt-3.5-turbo', 'gpt-4'],
        datasets: [
          {
            label: 'A+',
            data: [summaryData['gpt-3.5-turbo'].A_plus, summaryData['gpt-4'].A_plus],
            backgroundColor: '#4caf50', // Green
          },
          {
            label: 'A',
            data: [summaryData['gpt-3.5-turbo'].A, summaryData['gpt-4'].A],
            backgroundColor: '#8bc34a', // Light Green
          },
          {
            label: 'B',
            data: [summaryData['gpt-3.5-turbo'].B, summaryData['gpt-4'].B],
            backgroundColor: '#ffc107', // Amber
          },
          {
            label: 'D',
            data: [summaryData['gpt-3.5-turbo'].D, summaryData['gpt-4'].D],
            backgroundColor: '#ff9800', // Orange
          },
          {
            label: 'F',
            data: [summaryData['gpt-3.5-turbo'].F, summaryData['gpt-4'].F],
            backgroundColor: '#f44336', // Red
          },
        ],
      });

      const groupData = {
        'gpt-3.5-turbo': {
          good: summaryData['gpt-3.5-turbo'].A_plus + summaryData['gpt-3.5-turbo'].A,
          mid: summaryData['gpt-3.5-turbo'].B + summaryData['gpt-3.5-turbo'].D,
          bad: summaryData['gpt-3.5-turbo'].F,
        },
        'gpt-4': {
          good: summaryData['gpt-4'].A_plus + summaryData['gpt-4'].A,
          mid: summaryData['gpt-4'].B + summaryData['gpt-4'].D,
          bad: summaryData['gpt-4'].F,
        },
      };

      setPieData({
        'gpt-3.5-turbo': [groupData['gpt-3.5-turbo'].good, groupData['gpt-3.5-turbo'].mid, groupData['gpt-3.5-turbo'].bad],
        'gpt-4': [groupData['gpt-4'].good, groupData['gpt-4'].mid, groupData['gpt-4'].bad],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getTotal = (data) => data.reduce((sum, value) => sum + value, 0);

  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <Box sx={{ width: '100%', backgroundColor: "#0c4a6e", padding: 2, borderRadius: 4, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontSize: isSmallScreen ? '1.5rem' : '2rem' }}>
          Model Performance Summary
        </Typography>
        <Box sx={{ minHeight: isSmallScreen ? '350px' : '450px' }}>
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              aspectRatio: isSmallScreen ? 1 : 2.5, // Adjust aspect ratio for small screens
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: '#fff', // White color for legend labels
                    font: {
                      size: isSmallScreen ? 10 : 12,
                    },
                  },
                },
                title: {
                  display: true,
                  text: 'Results Summary',
                  color: '#fff', // White color for the title
                  font: {
                    size: isSmallScreen ? 12 : 16,
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    color: '#fff', // White color for X-axis labels
                    font: {
                      size: isSmallScreen ? 10 : 12,
                    },
                  },
                  grid: {
                    color: '#fff', // Darker grid lines
                  },
                },
                y: {
                  ticks: {
                    color: '#fff', // White color for Y-axis labels
                    font: {
                      size: isSmallScreen ? 10 : 12,
                    },
                  },
                  grid: {
                    color: '#fff', // Darker grid lines
                  },
                },
              },
            }}
          />
        </Box>
      </Box>
      <Grid container spacing={4}>
        {pieData && (
          <>
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%', backgroundColor: "#0c4a6e", padding: 2, borderRadius: 4 }}>
                <Typography variant="h5" align="center" gutterBottom sx={{ fontSize: isSmallScreen ? '1.2rem' : '1.5rem' }}>
                  gpt-3.5-turbo Group Distribution
                </Typography>
                <Pie
                  data={{
                    labels: ['Good (A+, A)', 'Mid (B, D)', 'Bad (F)'],
                    datasets: [{
                      data: pieData['gpt-3.5-turbo'],
                      backgroundColor: ['#4caf50', '#ffc107', '#f44336'], // Colors for Good, Mid, Bad
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#fff', // White color for legend labels
                          font: {
                            size: isSmallScreen ? 10 : 12,
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (tooltipItem) {
                            const data = tooltipItem.dataset.data;
                            const total = getTotal(data);
                            const value = data[tooltipItem.dataIndex];
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${tooltipItem.label}: ${value} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%', backgroundColor: "#0c4a6e", padding: 2, borderRadius: 4 }}>
                <Typography variant="h5" align="center" gutterBottom sx={{ fontSize: isSmallScreen ? '1.2rem' : '1.5rem' }}>
                  gpt-4 Group Distribution
                </Typography>
                <Pie
                  data={{
                    labels: ['Good (A+, A)', 'Mid (B, D)', 'Bad (F)'],
                    datasets: [{
                      data: pieData['gpt-4'],
                      backgroundColor: ['#4caf50', '#ffc107', '#f44336'], // Colors for Good, Mid, Bad
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#fff', // White color for legend labels
                          font: {
                            size: isSmallScreen ? 10 : 12,
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (tooltipItem) {
                            const data = tooltipItem.dataset.data;
                            const total = getTotal(data);
                            const value = data[tooltipItem.dataIndex];
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${tooltipItem.label}: ${value} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default FC_statistics;
