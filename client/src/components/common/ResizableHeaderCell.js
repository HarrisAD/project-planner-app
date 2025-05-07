// client/src/components/common/ResizableHeaderCell.js
import React, { useState, useEffect } from 'react';
import { TableCell } from '@mui/material';

// This is a simplified component that only makes the header cells resizable
// while keeping the regular table structure intact
const ResizableHeaderCell = ({
  children,
  width,
  onResize,
  id,
  storageKey = 'tableColumnWidths',
  ...props
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);

  // Initialize column width from localStorage or use provided width
  const [columnWidth, setColumnWidth] = useState(() => {
    try {
      const savedWidths = localStorage.getItem(storageKey);
      if (savedWidths) {
        const parsedWidths = JSON.parse(savedWidths);
        if (parsedWidths[id]) {
          return parsedWidths[id];
        }
      }
    } catch (err) {
      console.error('Error loading width from localStorage', err);
    }
    return width;
  });

  // Save width to localStorage when it changes
  useEffect(() => {
    try {
      const savedWidths = localStorage.getItem(storageKey);
      const parsedWidths = savedWidths ? JSON.parse(savedWidths) : {};
      parsedWidths[id] = columnWidth;
      localStorage.setItem(storageKey, JSON.stringify(parsedWidths));

      // Call the onResize callback if provided
      if (onResize) {
        onResize(id, columnWidth);
      }
    } catch (err) {
      console.error('Error saving width to localStorage', err);
    }
  }, [columnWidth, id, onResize, storageKey]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  // Handle mouse move during resize
  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(50, columnWidth + deltaX);
    setColumnWidth(newWidth);
    setStartX(e.clientX);
  };

  // Handle mouse up to end resize
  const handleMouseUp = () => {
    setIsResizing(false);

    // Clean up event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Reset cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <TableCell
      {...props}
      sx={{
        ...props.sx,
        position: 'relative',
        width: `${columnWidth}px`,
        minWidth: `${columnWidth}px`,
        maxWidth: `${columnWidth}px`,
        padding: '16px',
        fontWeight: 'bold',
      }}
    >
      {children}

      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '10px',
          cursor: 'col-resize',
          zIndex: 100,
          backgroundColor: isResizing
            ? 'rgba(33, 150, 243, 0.3)'
            : 'transparent',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator for the handle */}
        <div
          style={{
            position: 'absolute',
            right: '4px',
            top: '25%',
            height: '50%',
            width: '2px',
            backgroundColor: isResizing ? '#2196f3' : '#aaa',
          }}
        />
      </div>
    </TableCell>
  );
};

export default ResizableHeaderCell;
