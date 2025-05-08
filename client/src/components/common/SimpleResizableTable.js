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
} from '@mui/material';

const SimpleResizableTable = ({
  columns,
  rows,
  renderRow,
  storageKey = 'tableColumnWidths',
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
          initialWidths[col.id] = col.width || 150;
        });
        setColumnWidths(initialWidths);
      }
    } catch (err) {
      console.error('Error loading column widths from localStorage:', err);
    }
  }, [columns, storageKey]);

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

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                sx={{
                  position: 'relative',
                  width: columnWidths[column.id] || column.width || 150,
                  minWidth: columnWidths[column.id] || column.width || 150,
                  maxWidth: columnWidths[column.id] || column.width || 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                }}
              >
                {column.renderHeader ? column.renderHeader() : column.label}

                {/* Simple resize handle */}
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
                      columnWidths[column.id] || column.width || 150;

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

export default SimpleResizableTable;
