// client/src/components/common/ResizableTable.js
import React, { useEffect, useState, useRef } from 'react';
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

const ResizableTable = ({
  columns,
  rows,
  renderRow,
  storageKey = 'tableColumnWidths',
  defaultColumnWidth = 150,
}) => {
  // State to track column widths
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const tableRef = useRef(null);
  const startXRef = useRef(null);
  const startWidthRef = useRef(null);

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

  // Handle mouse down on resize handle
  const handleResizeStart = (e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(columnId);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[columnId] || defaultColumnWidth;

    // Add the event listeners to document
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleResizeEnd);

    // Add a class to the body to change cursor during resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
  };

  // Handle mouse move during resize
  const handleMouseMove = (e) => {
    if (!resizing) return;

    // Request animation frame for smoother performance
    window.requestAnimationFrame(() => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + deltaX); // Minimum 50px width

      setColumnWidths((prev) => ({
        ...prev,
        [resizing]: newWidth,
      }));
    });
  };

  // Handle mouse up to end resize
  const handleResizeEnd = () => {
    setResizing(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleResizeEnd);

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  return (
    <TableContainer component={Paper} ref={tableRef}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                sx={{
                  position: 'relative',
                  width: columnWidths[column.id] || defaultColumnWidth,
                  minWidth: columnWidths[column.id] || defaultColumnWidth,
                  maxWidth: columnWidths[column.id] || defaultColumnWidth,
                  padding: column.padding || '16px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                }}
              >
                {column.renderHeader ? column.renderHeader() : column.label}

                {/* Resize handle - with visible indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '10px',
                    cursor: 'col-resize',
                    zIndex: 10,
                    backgroundColor:
                      resizing === column.id ? '#2196f3' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    },
                    // Improve the hit area by extending it outside the visible area
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: '-5px',
                      width: '15px',
                      height: '100%',
                      cursor: 'col-resize',
                    },
                    // Add a visible indicator inside the handle
                    '&::before': {
                      content: '""',
                      width: '1px',
                      height: '60%',
                      backgroundColor: '#aaa',
                      position: 'absolute',
                      right: '4px',
                    },
                  }}
                  onMouseDown={(e) => handleResizeStart(e, column.id)}
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
