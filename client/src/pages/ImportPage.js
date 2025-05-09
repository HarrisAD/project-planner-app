import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { importService } from '../services/api';
import ColumnMapper from '../components/import/ColumnMapper';
import ImportPreview from '../components/import/ImportPreview';
import { useNotification } from '../context/NotificationContext';

// Define import steps
const steps = ['Upload File', 'Map Columns', 'Preview & Import'];

function ImportPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mappedData, setMappedData] = useState(null);
  const [columnMapping, setColumnMapping] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadSuccess(false);
      setParsedData(null);
      setActiveStep(0);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await importService.parseTaskFile(file);
      setParsedData(response.data);
      setUploadSuccess(true);
      setActiveStep(1); // Move to column mapping step
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingComplete = (transformedData, mapping) => {
    setMappedData(transformedData);
    setColumnMapping(mapping);
    setActiveStep(2); // Move to preview step
  };

  const handleBackToMapping = () => {
    setActiveStep(1);
  };

  const handleImportComplete = () => {
    showNotification('Tasks imported successfully');
    navigate('/tasks');
  };

  const handleDownloadTemplate = () => {
    importService.downloadTemplate();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Upload File
        return (
          <Box sx={{ my: 3 }}>
            <Box
              component="label"
              htmlFor="file-upload"
              sx={{
                display: 'block',
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <CloudUploadIcon fontSize="large" color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Drag and drop a file here or click to select a file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports Excel (.xlsx, .xls) and CSV files
              </Typography>
              {file && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleFileUpload}
                disabled={!file || loading}
                sx={{ minWidth: 150 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Upload & Parse'}
              </Button>
            </Box>
          </Box>
        );
      case 1: // Map Columns
        return parsedData ? (
          <ColumnMapper
            fileData={parsedData}
            onMappingComplete={handleMappingComplete}
          />
        ) : null;
      case 2: // Preview & Import
        return mappedData ? (
          <ImportPreview
            data={mappedData}
            columnMapping={columnMapping}
            onBack={handleBackToMapping}
            onComplete={handleImportComplete}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Import Data
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Import Tasks" />
          <Tab label="Import Projects" disabled />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Import Tasks from Excel
          </Typography>

          <Typography variant="body1" paragraph>
            Upload an Excel (.xlsx, .xls) or CSV file containing task data.
            Download the template for the required format.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {uploadSuccess && activeStep === 0 && (
            <Alert severity="success" sx={{ mb: 3 }}>
              File uploaded successfully! {parsedData.rowCount} rows found.
            </Alert>
          )}

          {renderStepContent()}
        </Paper>
      )}
    </Box>
  );
}

export default ImportPage;
