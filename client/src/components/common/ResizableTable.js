import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TableSortLabel,
  Tooltip,
  IconButton,
  Checkbox,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ResizableTable = ({
  columns,
  rows,
  renderRow,
  storageKey = 'tableColumnWidths',
  onSort = null,
  defaultColumnWidth = 150,
  sx = {},
  selectedItems = [], // New prop
  onSelectAll = null, // New prop
  enableSelection = false, // New prop
}) => {
  // State to track column widths
  const [columnWidths, setColumnWidths] = useState({});

  // Load saved column widths from localStorage on mount
  useEffect(() => {
    try {
      const savedWidths = localStorage.getItem(storageKey);
      if (savedWidths) {
        setColumnWidths(JSON.parse(savedWidths));
      } else {
        // Initialize with default widths if none saved
        const initialWidths = {};
        columns.forEach((col) => {
          initialWidths[col.id] = col.width || defaultColumnWidth;
        });
        setColumnWidths(initialWidths);
      }
    } catch (err) {
      console.error('Error loading column widths from localStorage:', err);
    }
  }, [columns, storageKey, defaultColumnWidth]);

  // Save column widths to localStorage when they change
  useEffect(() => {
    if (Object.keys(columnWidths).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columnWidths));
      } catch (err) {
        console.error('Error saving column widths to localStorage:', err);
      }
    }
  }, [columnWidths, storageKey]);

  // Calculate total width for table
  const getTotalWidth = () => {
    return columns.reduce((total, column) => {
      return (
        total + (columnWidths[column.id] || column.width || defaultColumnWidth)
      );
    }, 0);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        ...sx,
      }}
    >
      <Table
        sx={{
          minWidth: getTotalWidth(),
          tableLayout: 'fixed',
        }}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                sx={{
                  position: 'relative',
                  width:
                    columnWidths[column.id] ||
                    column.width ||
                    defaultColumnWidth,
                  minWidth:
                    columnWidths[column.id] ||
                    column.width ||
                    defaultColumnWidth,
                  maxWidth:
                    columnWidths[column.id] ||
                    column.width ||
                    defaultColumnWidth,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5', // Light gray background for header
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {column.id === 'select' && enableSelection ? (
                  <Checkbox
                    checked={
                      rows.length > 0 && selectedItems.length === rows.length
                    }
                    indeterminate={
                      selectedItems.length > 0 &&
                      selectedItems.length < rows.length
                    }
                    onChange={onSelectAll}
                    size="small"
                    color="primary"
                  />
                ) : column.sortable && onSort ? (
                  <TableSortLabel onClick={() => onSort(column.id)}>
                    {column.label}
                  </TableSortLabel>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {column.label}
                    {column.hasTooltip && (
                      <Tooltip title={column.tooltipText || ''} arrow>
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}

                {/* Resize handle */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '10px',
                    cursor: 'col-resize',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: '4px',
                      top: '25%',
                      height: '50%',
                      width: '2px',
                      backgroundColor: '#aaa',
                    },
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth =
                      columnWidths[column.id] ||
                      column.width ||
                      defaultColumnWidth;

                    const handleMouseMove = (moveEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const newWidth = Math.max(50, startWidth + deltaX);
                      setColumnWidths((prev) => ({
                        ...prev,
                        [column.id]: newWidth,
                      }));
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        'mousemove',
                        handleMouseMove
                      );
                      document.removeEventListener('mouseup', handleMouseUp);
                      document.body.style.cursor = '';
                      document.body.style.userSelect = '';
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';

                    e.preventDefault();
                  }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>{renderRow(row, columnWidths)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResizableTable;
