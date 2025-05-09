import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Alert,
  Divider,
  Chip,
} from '@mui/material';

// List of expected columns for tasks
const EXPECTED_COLUMNS = [
  { id: 'name', label: 'Task Name', required: true },
  { id: 'subTaskName', label: 'Sub Task Name', required: false },
  { id: 'projectName', label: 'Project Name', required: true },
  { id: 'assignee', label: 'Assignee', required: true },
  { id: 'status', label: 'Status', required: false },
  { id: 'startDate', label: 'Start Date', required: true },
  { id: 'dueDate', label: 'Due Date', required: true },
  { id: 'daysAssigned', label: 'Days Assigned', required: true },
  { id: 'daysTaken', label: 'Days Taken', required: false },
  { id: 'description', label: 'Description', required: false },
  { id: 'pathToGreen', label: 'Path to Green', required: false },
  { id: 'tauNotes', label: 'TAU Notes', required: false },
  { id: 'persona', label: 'Persona', required: false },
];

function ColumnMapper({ fileData, onMappingComplete }) {
  const [fileColumns, setFileColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [autoMapped, setAutoMapped] = useState(false);

  // Extract column headers when fileData changes
  useEffect(() => {
    if (fileData && fileData.data && fileData.data.length > 0) {
      const firstRow = fileData.data[0];
      const columns = Object.keys(firstRow);
      setFileColumns(columns);

      // Attempt automatic mapping based on similar column names
      const initialMapping = {};
      columns.forEach((fileCol) => {
        // Normalize the column name for comparison (lowercase, no spaces)
        const normalizedFileCol = fileCol.toLowerCase().replace(/\s+/g, '');

        // Find a matching expected column
        const matchedColumn = EXPECTED_COLUMNS.find((expectedCol) => {
          const normalizedExpectedCol = expectedCol.label
            .toLowerCase()
            .replace(/\s+/g, '');
          return (
            normalizedFileCol === normalizedExpectedCol ||
            normalizedFileCol === expectedCol.id.toLowerCase()
          );
        });

        if (matchedColumn) {
          initialMapping[matchedColumn.id] = fileCol;
        }
      });

      setMapping(initialMapping);
      setAutoMapped(Object.keys(initialMapping).length > 0);
      validateMapping(initialMapping);
    }
  }, [fileData]);

  const handleMappingChange = (expectedColumnId, fileColumnName) => {
    const newMapping = {
      ...mapping,
      [expectedColumnId]: fileColumnName,
    };

    // If empty value selected, remove the mapping
    if (!fileColumnName) {
      delete newMapping[expectedColumnId];
    }

    setMapping(newMapping);
    validateMapping(newMapping);
  };

  const validateMapping = (currentMapping) => {
    const errors = [];

    // Check required columns
    EXPECTED_COLUMNS.forEach((col) => {
      if (col.required && !currentMapping[col.id]) {
        errors.push(`Required column "${col.label}" is not mapped`);
      }
    });

    setValidationErrors(errors);
  };

  const handleSubmit = () => {
    if (validationErrors.length > 0) {
      return;
    }

    // Transform the data using the mapping
    const transformedData = fileData.data.map((row) => {
      const transformedRow = {};

      // Map each expected column
      for (const [expectedColId, fileCol] of Object.entries(mapping)) {
        transformedRow[expectedColId] = row[fileCol];
      }

      return transformedRow;
    });

    onMappingComplete(transformedData, mapping);
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Map Columns
      </Typography>

      <Typography variant="body1" paragraph>
        Match the columns from your file to the expected fields. Required fields
        are marked with an asterisk (*).
      </Typography>

      {autoMapped && (
        <Alert severity="info" sx={{ mb: 3 }}>
          We've automatically mapped some columns based on their names. Please
          verify the mapping is correct.
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please fix the following issues before continuing:
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        {EXPECTED_COLUMNS.map((expectedCol) => (
          <Grid item xs={12} sm={6} md={4} key={expectedCol.id}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel id={`label-${expectedCol.id}`}>
                {expectedCol.label}
                {expectedCol.required && ' *'}
              </InputLabel>
              <Select
                labelId={`label-${expectedCol.id}`}
                value={mapping[expectedCol.id] || ''}
                onChange={(e) =>
                  handleMappingChange(expectedCol.id, e.target.value)
                }
                label={`${expectedCol.label}${
                  expectedCol.required ? ' *' : ''
                }`}
                error={expectedCol.required && !mapping[expectedCol.id]}
              >
                <MenuItem value="">
                  <em>Not mapped</em>
                </MenuItem>
                {fileColumns.map((fileCol) => (
                  <MenuItem
                    key={fileCol}
                    value={fileCol}
                    // Disable if this column is already mapped to something else
                    disabled={
                      Object.values(mapping).includes(fileCol) &&
                      mapping[expectedCol.id] !== fileCol
                    }
                  >
                    {fileCol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Mapped Fields:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(mapping).map(([expectedColId, fileCol]) => (
              <Chip
                key={expectedColId}
                label={`${
                  EXPECTED_COLUMNS.find((col) => col.id === expectedColId)
                    ?.label
                }: ${fileCol}`}
                color="primary"
                variant="outlined"
                onDelete={() => handleMappingChange(expectedColId, '')}
              />
            ))}
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={validationErrors.length > 0}
        >
          Continue to Data Preview
        </Button>
      </Box>
    </Paper>
  );
}

export default ColumnMapper;
