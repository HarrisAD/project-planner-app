import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import { assigneeService } from '../services/api';
import AssigneeForm from '../components/assignees/AssigneeForm';
import HolidayForm from '../components/assignees/HolidayForm';
import HolidayRangeForm from '../components/holidays/HolidayRangeForm';
import HolidayList from '../components/assignees/HolidayList';
import PublicHolidayList from '../components/holidays/PublicHolidayList';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

function AssigneesPage() {
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openHolidayForm, setOpenHolidayForm] = useState(false);
  const [openHolidayRangeForm, setOpenHolidayRangeForm] = useState(false);
  const [currentAssignee, setCurrentAssignee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assigneeToDelete, setAssigneeToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchAssignees = async () => {
    try {
      setLoading(true);
      const response = await assigneeService.getAll();
      setAssignees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assignees:', err);
      setError(err.response?.data?.error || 'Failed to fetch assignees');
      showNotification('Failed to fetch assignees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateAssignee = async (data) => {
    try {
      await assigneeService.create(data);
      fetchAssignees();
      setOpenForm(false);
      showNotification('Assignee created successfully');
    } catch (err) {
      console.error('Error creating assignee:', err);
      setError(err.response?.data?.error || 'Failed to create assignee');
      showNotification('Failed to create assignee', 'error');
    }
  };

  const handleUpdateAssignee = async (data) => {
    try {
      if (!currentAssignee) return;

      await assigneeService.update(currentAssignee.id, data);
      fetchAssignees();
      setOpenForm(false);
      setCurrentAssignee(null);
      setIsEditing(false);
      showNotification('Assignee updated successfully');
    } catch (err) {
      console.error('Error updating assignee:', err);
      setError(err.response?.data?.error || 'Failed to update assignee');
      showNotification('Failed to update assignee', 'error');
    }
  };

  const handleOpenCreateForm = () => {
    setCurrentAssignee(null);
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEditForm = (assignee) => {
    setCurrentAssignee(assignee);
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentAssignee(null);
    setIsEditing(false);
  };

  const handleFormSubmit = (data) => {
    if (isEditing) {
      handleUpdateAssignee(data);
    } else {
      handleCreateAssignee(data);
    }
  };

  const handleOpenDeleteDialog = (assignee) => {
    setAssigneeToDelete(assignee);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAssigneeToDelete(null);
  };

  const handleDeleteAssignee = async () => {
    try {
      if (!assigneeToDelete) return;

      await assigneeService.delete(assigneeToDelete.id);
      fetchAssignees();
      setDeleteDialogOpen(false);
      setAssigneeToDelete(null);
      showNotification('Assignee deleted successfully');
    } catch (err) {
      console.error('Error deleting assignee:', err);
      if (err.response?.data?.count) {
        setError(
          `Cannot delete assignee that is assigned to ${err.response.data.count} tasks.`
        );
      } else {
        setError(err.response?.data?.error || 'Failed to delete assignee');
      }
      showNotification('Failed to delete assignee', 'error');
    }
  };

  const handleViewHolidays = async (assignee) => {
    setCurrentAssignee(assignee);
    setTabValue(1);
    fetchHolidays(assignee.id);
  };

  const fetchHolidays = async (assigneeId) => {
    try {
      setHolidaysLoading(true);
      const response = await assigneeService.getHolidays(assigneeId);
      setHolidays(response.data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
      showNotification('Failed to fetch holidays', 'error');
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleOpenHolidayForm = () => {
    setOpenHolidayForm(true);
  };

  const handleCloseHolidayForm = () => {
    setOpenHolidayForm(false);
  };

  const handleOpenHolidayRangeForm = () => {
    setOpenHolidayRangeForm(true);
  };

  const handleCloseHolidayRangeForm = () => {
    setOpenHolidayRangeForm(false);
  };

  const handleAddHoliday = async (data) => {
    try {
      if (!currentAssignee) return;

      await assigneeService.addHoliday(currentAssignee.id, data);
      fetchHolidays(currentAssignee.id);
      setOpenHolidayForm(false);
      showNotification('Holiday added successfully');
    } catch (err) {
      console.error('Error adding holiday:', err);
      showNotification('Failed to add holiday', 'error');
    }
  };

  const handleAddHolidayRange = async (data) => {
    try {
      if (!currentAssignee) return;

      await assigneeService.addHolidayRange(currentAssignee.id, {
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      });

      fetchHolidays(currentAssignee.id);
      setOpenHolidayRangeForm(false);
      showNotification('Holiday range added successfully');
    } catch (err) {
      console.error('Error adding holiday range:', err);
      showNotification('Failed to add holiday range', 'error');
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      await assigneeService.deleteHoliday(holidayId);
      fetchHolidays(currentAssignee?.id);
      showNotification('Holiday deleted successfully');
    } catch (err) {
      console.error('Error deleting holiday:', err);
      showNotification('Failed to delete holiday', 'error');
    }
  };

  const handleBackToAssignees = () => {
    setTabValue(0);
    setCurrentAssignee(null);
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === 0 || newValue === 2 || currentAssignee) {
      setTabValue(newValue);
    }
  };

  if (loading && assignees.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Assignees" />
          <Tab label="Assignee Holidays" disabled={!currentAssignee} />
          <Tab label="Public Holidays" />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        // Assignees Tab
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4">Assignees</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateForm}
            >
              Add Assignee
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {!loading && assignees.length === 0 ? (
            <Typography>
              No assignees found. Create your first assignee!
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Working Days/Week</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignees.map((assignee) => (
                    <TableRow key={assignee.id}>
                      <TableCell>{assignee.name}</TableCell>
                      <TableCell>{assignee.email || '-'}</TableCell>
                      <TableCell>{assignee.working_days_per_week}</TableCell>
                      <TableCell>
                        {assignee.start_date
                          ? new Date(assignee.start_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewHolidays(assignee)}
                            title="View Holidays"
                          >
                            <CalendarMonthIcon fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenEditForm(assignee)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDeleteDialog(assignee)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : tabValue === 1 ? (
        // Holidays Tab
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Stack>
              <Typography variant="h4">
                Holidays for {currentAssignee?.name}
              </Typography>
              <Button
                variant="text"
                color="primary"
                onClick={handleBackToAssignees}
                sx={{ mt: 1 }}
              >
                Back to Assignees
              </Button>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EventIcon />}
                onClick={handleOpenHolidayForm}
              >
                Add Single Day
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DateRangeIcon />}
                onClick={handleOpenHolidayRangeForm}
              >
                Add Date Range
              </Button>
            </Stack>
          </Box>

          <HolidayList
            holidays={holidays}
            loading={holidaysLoading}
            onDelete={handleDeleteHoliday}
          />
        </>
      ) : (
        // Public Holidays Tab
        <PublicHolidayList />
      )}

      <AssigneeForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={currentAssignee}
        isEdit={isEditing}
      />

      <HolidayForm
        open={openHolidayForm}
        onClose={handleCloseHolidayForm}
        onSubmit={handleAddHoliday}
        assigneeName={currentAssignee?.name}
      />

      <HolidayRangeForm
        open={openHolidayRangeForm}
        onClose={handleCloseHolidayRangeForm}
        onSubmit={handleAddHolidayRange}
        assigneeName={currentAssignee?.name}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteAssignee}
        title="Delete Assignee"
        content={`Are you sure you want to delete the assignee "${assigneeToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
}

export default AssigneesPage;
