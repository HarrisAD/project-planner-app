import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Make sure this import is added
import { importService } from '../../services/api';

function ImportPreview({ data, columnMapping, onBack, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]); // Add this line to define the state
  const [page, setPage] = useState(1);
  const [importResult, setImportResult] = useState(null);
  const rowsPerPage = 10;

  // Get column display names from mapping
  const getColumnLabel = (columnId) => {
    const col =
      columnId === 'rowNumber'
        ? { label: '#' }
        : { label: columnId.charAt(0).toUpperCase() + columnId.slice(1) };
    return col.label;
  };

  // Get the columns to display in the preview table
  const columns = [
    { id: 'rowNumber', label: '#' },
    ...Object.keys(data[0] || {}).map((colId) => ({
      id: colId,
      label: getColumnLabel(colId),
    })),
  ];

  const handleProcessImport = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]); // Clear any previous validation errors

    try {
      // Log the data being sent
      console.log('Sending import data:');
      console.log('- Data:', data);
      console.log('- Mapping:', columnMapping);

      const response = await importService.processTaskImport(
        data,
        columnMapping
      );
      setImportResult(response.data);
    } catch (err) {
      console.error('Import processing error:', err);

      // More detailed error logging
      if (err.response) {
        console.error('Error response:', err.response.data);

        if (err.response.data.validationErrors) {
          setValidationErrors(err.response.data.validationErrors);
        } else if (err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError(`Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('No response received from server. Check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Calculate pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedData = data.slice(startIndex, endIndex);

  // Handle field rendering for different types
  const renderCellValue = (value, fieldName) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // Render date fields
    if (fieldName.toLowerCase().includes('date')) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }

    // Render status with a chip
    if (fieldName === 'status') {
      let color = 'default';
      switch (value) {
        case 'Completed':
          color = 'success';
          break;
        case 'In Progress':
          color = 'primary';
          break;
        case 'Not Started':
          color = 'default';
          break;
        case 'On Hold':
          color = 'warning';
          break;
        default:
          color = 'default';
      }
      return <Chip label={value} color={color} size="small" />;
    }

    // Render persona
    if (fieldName === 'persona') {
      const personaLabels = {
        exec_sponsor: 'Exec Sponsor',
        exec_lead: 'Exec Lead',
        developer: 'Developer',
        consultant: 'Consultant',
        programme_manager: 'Programme Manager',
      };
      return personaLabels[value] || value;
    }

    // Default rendering for other fields
    return value.toString();
  };

  // If validation errors, display them
  if (validationErrors.length > 0) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Import Validation Errors
        </Typography>

        <Alert severity="error" sx={{ mb: 3 }}>
          Please fix the following issues in your import data and try again.
        </Alert>

        <List>
          {validationErrors.map((error, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <ErrorOutlineIcon color="error" />
              </ListItemIcon>
              <ListItemText primary={error} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={onBack}>
            Back to Column Mapping
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setValidationErrors([]);
            }}
          >
            Dismiss Errors
          </Button>
        </Box>
      </Paper>
    );
  }

  // If import completed successfully, show results
  if (importResult) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Import Complete
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          {importResult.message}
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Typography variant="body1">
            Successfully imported {importResult.importedCount} tasks.
          </Typography>

          <Button variant="contained" color="primary" onClick={onComplete}>
            Return to Task List
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Data Preview
      </Typography>

      <Typography variant="body1" paragraph>
        Review the mapped data before completing the import. You'll be importing{' '}
        {data.length} tasks.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} sx={{ fontWeight: 'bold' }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{startIndex + index + 1}</TableCell>
                {Object.keys(row).map((colId) => (
                  <TableCell key={colId}>
                    {renderCellValue(row[colId], colId)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Pagination
          count={Math.ceil(data.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Back to Column Mapping
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleProcessImport}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Import Tasks'}
        </Button>
      </Box>
    </Paper>
  );
}

export default ImportPreview;
