import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid,
  Collapse,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  TableCell,
  Popover,
  TableSortLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotesIcon from '@mui/icons-material/Notes';
import { taskService } from '../services/api';
import TaskForm from '../components/tasks/TaskForm';
import TimeUsageDisplay from '../components/tasks/TimeUsageDisplay';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ResizableTable from '../components/common/ResizableTable'; // Import our new component
import { useNotification } from '../context/NotificationContext';
import {
  calculateEnhancedRagStatus,
  determineTaskStatus,
  timeAgo,
} from '../utils/dateUtils';
import { Link } from 'react-router-dom';
import FileUploadIcon from '@mui/icons-material/FileUpload';

// Define persona options
const PERSONA_OPTIONS = [
  { value: 'exec_sponsor', label: 'Exec Sponsor' },
  { value: 'exec_lead', label: 'Exec Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'programme_manager', label: 'Programme Manager' },
];

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { showNotification } = useNotification();
  const [editingSubTaskName, setEditingSubTaskName] = useState(null);
  const [subTaskNameValue, setSubTaskNameValue] = useState('');
  // Sorting states
  const [sortConfig, setSortConfig] = useState({
    key: 'dueDate',
    direction: 'asc',
  });
  // State for inline editable fields
  const [editingPathToGreen, setEditingPathToGreen] = useState(null);
  const [pathToGreenValue, setPathToGreenValue] = useState('');
  const [editingPersona, setEditingPersona] = useState(null);
  const [tauNotesAnchorEl, setTauNotesAnchorEl] = useState(null);
  const [currentTauNotes, setCurrentTauNotes] = useState('');
  const [editingTauNotes, setEditingTauNotes] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    subTaskName: '', // Changed from subTask: false
    project: '',
    assignee: '',
    status: '',
    rag: '',
    dueDate: '',
    persona: '',
  });

  // Filter options (derived from task data)
  const [filterOptions, setFilterOptions] = useState({
    projects: [],
    assignees: [],
    statuses: [],
    personas: PERSONA_OPTIONS.map((p) => p.value),
  });

  // Define table columns
  const columns = [
    { id: 'select', label: 'Select', width: 70 },
    { id: 'name', label: 'Task', width: 200 },
    { id: 'subTaskName', label: 'Sub Task', width: 150 },
    { id: 'project', label: 'Project', width: 150 },
    { id: 'assignee', label: 'Assignee', width: 120 },
    { id: 'status', label: 'Status', width: 120 },
    {
      id: 'rag',
      label: 'RAG',
      width: 120,
      sortable: true,
      hasTooltip: true, // Add this flag
      tooltipText:
        'Automatically calculated based on days assigned, days taken, assignee working days, and holidays', // Add tooltip text
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      width: 120,
      sortable: true,
    },
    {
      id: 'timeUsage',
      label: 'Time Usage',
      width: 200,
      sortable: false,
      hasTooltip: true, // Add this flag
      tooltipText:
        'Shows days taken vs days assigned and completion percentage', // Add tooltip text
    },
    { id: 'pathToGreen', label: 'Path to Green', width: 200 },
    { id: 'notes', label: 'Notes', width: 80 },
    {
      id: 'lastUpdated',
      label: 'Last Updated',
      width: 120,
      sortable: true,
    },
    { id: 'persona', label: 'Persona', width: 150, sortable: true },
    { id: 'actions', label: 'Actions', width: 150 },
  ];

  const sortTasks = (tasks) => {
    if (!sortConfig.key) return tasks;

    return [...tasks].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'dueDate':
          aValue = a.due_date ? new Date(a.due_date) : new Date(0);
          bValue = b.due_date ? new Date(b.due_date) : new Date(0);
          break;
        case 'rag':
          aValue = a.timeInfo?.calculatedRag || 0;
          bValue = b.timeInfo?.calculatedRag || 0;
          break;
        case 'lastUpdated':
          aValue = a.last_updated_days
            ? new Date(a.last_updated_days)
            : new Date(0);
          bValue = b.last_updated_days
            ? new Date(b.last_updated_days)
            : new Date(0);
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        // Add other sortable columns...
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  // Handle sorting when column header is clicked
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  // Handle Sub Task Name inline editing
  const handleSubTaskNameEdit = (taskId, currentValue) => {
    console.log(
      'Editing sub-task name for task ID:',
      taskId,
      'Current value:',
      currentValue
    );
    setEditingSubTaskName(taskId);
    setSubTaskNameValue(currentValue || '');
  };

  const saveSubTaskName = async () => {
    if (!editingSubTaskName) return;

    try {
      const task = tasks.find((t) => t.id === editingSubTaskName);
      if (!task) return;

      // Create a complete update object that preserves all original values
      const updateData = {
        name: task.name,
        subTaskName: subTaskNameValue,
        projectId: task.project_id,
        assignee: task.assignee,
        status: task.status,
        rag: task.rag,
        startDate: task.start_date,
        dueDate: task.due_date,
        daysAssigned: task.days_assigned,
        daysTaken: task.days_taken,
        description: task.description || '',
        tauNotes: task.tau_notes || '',
        pathToGreen: task.path_to_green || '',
        persona: task.persona || '',
      };

      await taskService.update(task.id, updateData);

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, sub_task_name: subTaskNameValue } : t
        )
      );
      console.log(
        'Updated tasks after editing sub-task:',
        tasks.map((t) => ({
          id: t.id,
          name: t.name,
          subTaskName: t.sub_task_name,
        }))
      );
      showNotification('Sub Task Name updated successfully');
      setEditingSubTaskName(null);
    } catch (err) {
      console.error('Error updating sub task name:', err);
      showNotification('Failed to update sub task name', 'error');
    }
  };
  // Handle Tau Notes popover
  const handleTauNotesClick = (event, task) => {
    setTauNotesAnchorEl(event.currentTarget);
    setCurrentTauNotes(task.tau_notes || '');
    setEditingTauNotes(task.id);
  };

  const handleTauNotesClose = () => {
    setTauNotesAnchorEl(null);
    setEditingTauNotes(null);
  };

  const saveTauNotes = async () => {
    if (!editingTauNotes) return;

    try {
      const task = tasks.find((t) => t.id === editingTauNotes);
      if (!task) return;

      const updatedTask = {
        ...task,
        tau_notes: currentTauNotes,
      };

      // Create a complete update object that preserves all original values
      const updateData = {
        name: task.name,
        projectId: task.project_id,
        assignee: task.assignee,
        status: task.status,
        rag: task.rag,
        startDate: task.start_date,
        dueDate: task.due_date,
        daysAssigned: task.days_assigned,
        daysTaken: task.days_taken,
        description: task.description || '',
        tauNotes: currentTauNotes,
        pathToGreen: task.path_to_green || '',
        persona: task.persona || '',
        subTaskName: task.sub_task_name || '',
      };

      await taskService.update(task.id, updateData);

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, tau_notes: currentTauNotes } : t
        )
      );
      showNotification('Tau notes updated successfully');
      handleTauNotesClose();
    } catch (err) {
      console.error('Error updating tau notes:', err);
      showNotification('Failed to update tau notes', 'error');
    }
  };

  // Handle path to green inline editing
  const handlePathToGreenEdit = (taskId, currentValue) => {
    setEditingPathToGreen(taskId);
    setPathToGreenValue(currentValue || '');
  };

  const savePathToGreen = async () => {
    if (!editingPathToGreen) return;

    try {
      const task = tasks.find((t) => t.id === editingPathToGreen);
      if (!task) return;

      // Create a complete update object that preserves all original values
      const updateData = {
        name: task.name,
        projectId: task.project_id,
        assignee: task.assignee,
        status: task.status,
        rag: task.rag,
        startDate: task.start_date,
        dueDate: task.due_date,
        daysAssigned: task.days_assigned,
        daysTaken: task.days_taken,
        description: task.description || '',
        tauNotes: task.tau_notes || '',
        pathToGreen: pathToGreenValue,
        persona: task.persona || '',
        isSubTask: task.is_sub_task || false,
        parentTaskId: task.parent_task_id || null,
      };

      await taskService.update(task.id, updateData);

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, path_to_green: pathToGreenValue } : t
        )
      );
      showNotification('Path to Green updated successfully');
      setEditingPathToGreen(null);
    } catch (err) {
      console.error('Error updating path to green:', err);
      showNotification('Failed to update path to green', 'error');
    }
  };

  // Handle persona dropdown change
  const handlePersonaChange = async (taskId, newPersona) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Create a complete update object that preserves all original values
      const updateData = {
        name: task.name,
        projectId: task.project_id,
        assignee: task.assignee,
        status: task.status,
        rag: task.rag,
        startDate: task.start_date,
        dueDate: task.due_date,
        daysAssigned: task.days_assigned,
        daysTaken: task.days_taken,
        description: task.description || '',
        tauNotes: task.tau_notes || '',
        pathToGreen: task.path_to_green || '',
        persona: newPersona,
        isSubTask: task.is_sub_task || false,
        parentTaskId: task.parent_task_id || null,
      };

      await taskService.update(task.id, updateData);

      // Update local state
      setTasks(
        tasks.map((t) => (t.id === task.id ? { ...t, persona: newPersona } : t))
      );
      showNotification('Persona updated successfully');
    } catch (err) {
      console.error('Error updating persona:', err);
      showNotification('Failed to update persona', 'error');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAll();

      // Debug the raw data coming from the API
      console.log('Raw API response for first task:', {
        ...response.data[0],
        days_assigned: response.data[0].days_assigned,
        days_assigned_type: typeof response.data[0].days_assigned,
        days_taken: response.data[0].days_taken,
        days_taken_type: typeof response.data[0].days_taken,
      });

      // Process each task to calculate enhanced RAG status
      const tasksPromises = response.data.map(async (task) => {
        // Ensure values are properly parsed as floats with consistent decimal handling
        const daysAssigned =
          typeof task.days_assigned === 'string'
            ? parseFloat(task.days_assigned)
            : task.days_assigned;

        const daysTaken =
          typeof task.days_taken === 'string'
            ? parseFloat(task.days_taken)
            : task.days_taken;

        // Use safer defaults for null or NaN values
        const finalDaysAssigned = isNaN(daysAssigned)
          ? 0
          : parseFloat(daysAssigned.toFixed(1));
        const finalDaysTaken = isNaN(daysTaken)
          ? 0
          : parseFloat(daysTaken.toFixed(1));

        const dueDate = task.due_date;
        const assignee = task.assignee;

        console.log(
          `Task ${task.id}: days_assigned=${
            task.days_assigned
          } (${typeof task.days_assigned}), parsed=${daysAssigned}, final=${finalDaysAssigned}`
        );

        // Create a normalized task object with properly formatted decimal values
        const normalizedTask = {
          ...task,
          days_assigned: finalDaysAssigned,
          days_taken: finalDaysTaken,
        };

        let timeInfo = {
          daysRemaining: parseFloat(
            Math.max(0, finalDaysAssigned - finalDaysTaken).toFixed(1)
          ),
          percentComplete:
            finalDaysAssigned > 0
              ? (finalDaysTaken / finalDaysAssigned) * 100
              : 0,
          businessDaysUntilDue: 0,
          buffer: 0,
          calculatedRag: task.rag || 1, // Default to existing RAG
        };
        // ... rest of function

        // Calculate enhanced RAG status if we have all necessary data
        if (dueDate && assignee) {
          try {
            const result = await calculateEnhancedRagStatus(
              daysAssigned,
              daysTaken,
              dueDate,
              assignee
            );

            timeInfo = {
              ...timeInfo,
              businessDaysUntilDue: result.assigneeWorkingDays,
              buffer: result.buffer,
              calculatedRag: result.ragStatus,
              workingDaysPerWeek: result.workingDaysPerWeek,
              holidayCount: result.holidayCount,
            };
          } catch (error) {
            console.error(`Error calculating RAG for task ${task.id}:`, error);
          }
        }

        return {
          ...normalizedTask,
          timeInfo,
        };
      });

      // Wait for all RAG calculations to complete
      const enhancedTasks = await Promise.all(tasksPromises);

      // Extract filter options from the tasks
      const projectOptions = [
        ...new Set(enhancedTasks.map((task) => task.project_name)),
      ]
        .filter(Boolean)
        .sort();
      const assigneeOptions = [
        ...new Set(enhancedTasks.map((task) => task.assignee)),
      ]
        .filter(Boolean)
        .sort();
      const statusOptions = [
        ...new Set(enhancedTasks.map((task) => task.status)),
      ]
        .filter(Boolean)
        .sort();

      setFilterOptions({
        projects: projectOptions,
        assignees: assigneeOptions,
        statuses: statusOptions,
        personas: PERSONA_OPTIONS.map((p) => p.value),
      });

      setTasks(enhancedTasks);
      setSelectedTasks([]); // Clear task selections
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      showNotification('Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever tasks or filters change
  useEffect(() => {
    // First apply filters
    let filtered = [...tasks];

    // Filter by name
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by project
    if (filters.project) {
      filtered = filtered.filter(
        (task) => task.project_name === filters.project
      );
    }

    // Filter by assignee
    if (filters.assignee) {
      filtered = filtered.filter((task) => task.assignee === filters.assignee);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // Filter by RAG status
    if (filters.rag) {
      const ragValue = parseInt(filters.rag);
      filtered = filtered.filter(
        (task) => task.timeInfo && task.timeInfo.calculatedRag === ragValue
      );
    }

    // Filter by due date
    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filterDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter((task) => {
        if (!task.due_date) return false;
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        return taskDueDate.getTime() === filterDate.getTime();
      });
    }

    // Filter by persona
    if (filters.persona) {
      filtered = filtered.filter((task) => task.persona === filters.persona);
    }

    // Filter by sub-task status
    if (filters.subTaskName) {
      const searchTerm = filters.subTaskName.toLowerCase();
      filtered = filtered.filter((task) =>
        task.sub_task_name?.toLowerCase().includes(searchTerm)
      );
    }

    // Then sort the filtered results
    const sortedTasks = sortTasks(filtered);

    setFilteredTasks(sortedTasks);
  }, [tasks, filters, sortConfig]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to apply filters to tasks
  const applyFilters = () => {
    let result = [...tasks];

    // Filter by name
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter((task) =>
        task.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by project
    if (filters.project) {
      result = result.filter((task) => task.project_name === filters.project);
    }

    // Filter by assignee
    if (filters.assignee) {
      result = result.filter((task) => task.assignee === filters.assignee);
    }

    // Filter by status
    if (filters.status) {
      result = result.filter((task) => task.status === filters.status);
    }

    // Filter by RAG status
    if (filters.rag) {
      const ragValue = parseInt(filters.rag);
      result = result.filter(
        (task) => task.timeInfo && task.timeInfo.calculatedRag === ragValue
      );
    }

    // Filter by due date
    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filterDate.setHours(0, 0, 0, 0);

      result = result.filter((task) => {
        if (!task.due_date) return false;
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        return taskDueDate.getTime() === filterDate.getTime();
      });
    }

    // Filter by persona
    if (filters.persona) {
      result = result.filter((task) => task.persona === filters.persona);
    }

    // Filter by sub-task status
    if (filters.subTaskName) {
      const searchTerm = filters.subTaskName.toLowerCase();
      result = result.filter((task) =>
        task.sub_task_name?.toLowerCase().includes(searchTerm)
      );
    }
    setFilteredTasks(result);
  };

  // Filter change handler
  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Special handler for boolean filters (checkboxes)
  const handleBooleanFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      subTaskName: '',
      project: '',
      assignee: '',
      status: '',
      rag: '',
      dueDate: '',
      persona: '',
    });
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const handleCreateTask = async (taskData) => {
    try {
      // Ensure days values are processed as floats
      const processedData = {
        ...taskData,
        daysAssigned: parseFloat(taskData.daysAssigned),
        daysTaken: parseFloat(taskData.daysTaken || 0),
      };

      console.log('Creating task with data:', processedData);
      await taskService.create(processedData);
      fetchTasks(); // Refresh the list
      setOpenForm(false);
      showNotification('Task created successfully');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Failed to create task');
      showNotification('Failed to create task', 'error');
    }
  };
  const handleUpdateTask = async (taskData) => {
    try {
      if (!currentTask) return;

      // Ensure daysAssigned and daysTaken are properly formatted as floats
      const processedData = {
        ...taskData,
        // Ensure these are parsed as floats with one decimal place precision
        daysAssigned: parseFloat(parseFloat(taskData.daysAssigned).toFixed(1)),
        daysTaken: parseFloat(parseFloat(taskData.daysTaken || 0).toFixed(1)),
      };

      // Make sure subTaskName is being included in your API call
      await taskService.update(currentTask.id, processedData);

      // Add a small delay before fetching to ensure the backend has completed the update
      setTimeout(() => {
        fetchTasks(); // Refresh the list with a slight delay
      }, 100);

      setOpenForm(false);
      setCurrentTask(null);
      setIsEditing(false);
      showNotification('Task updated successfully');
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.error || 'Failed to update task');
      showNotification('Failed to update task', 'error');
    }
  };
  const handleOpenCreateForm = () => {
    setCurrentTask(null);
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEditForm = (task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentTask(null);
    setIsEditing(false);
  };

  const handleFormSubmit = (data) => {
    if (isEditing) {
      handleUpdateTask(data);
    } else {
      handleCreateTask(data);
    }
  };

  const handleOpenDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
    // We're deliberately NOT clearing selectedTasks here
    // This allows users to try again with the same selection if they cancel
  };

  const handleDeleteTask = async () => {
    try {
      if (taskToDelete) {
        // Single task deletion (existing behavior)
        await taskService.delete(taskToDelete.id);
        fetchTasks(); // Refresh the list
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
        showNotification('Task deleted successfully');
      } else if (selectedTasks.length > 0) {
        // Mass deletion of selected tasks
        // Ideally, we'd have a batch delete endpoint in the API
        // For now, we'll delete tasks one by one
        for (const taskId of selectedTasks) {
          await taskService.delete(taskId);
        }
        fetchTasks(); // Refresh the list
        setDeleteDialogOpen(false);
        setSelectedTasks([]); // Clear selected tasks after deletion
        showNotification(`${selectedTasks.length} tasks deleted successfully`);
      }
    } catch (err) {
      console.error('Error deleting task(s):', err);
      setError(err.response?.data?.error || 'Failed to delete task(s)');
      showNotification('Failed to delete task(s)', 'error');
    }
  };
  // In client/src/pages/TasksPage.js - handleQuickUpdateDaysTaken function

  const handleQuickUpdateDaysTaken = async (task, increment) => {
    try {
      // Get the current task from state first
      const currentTask = tasks.find((t) => t.id === task.id);
      if (!currentTask) {
        throw new Error('Task not found in current state');
      }

      // Helper function to safely parse values
      const safeParseFloat = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Ensure we handle numeric values properly
      const currentDaysTaken = safeParseFloat(currentTask.days_taken);

      // Calculate new days taken with fixed precision
      const newDaysTaken = parseFloat(
        Math.max(0, currentDaysTaken + increment).toFixed(1)
      );

      console.log(`Updating days taken for task ${task.id}:`);
      console.log(
        `  Original value:`,
        currentTask.days_taken,
        `(${typeof currentTask.days_taken})`
      );
      console.log(
        `  Parsed value:`,
        currentDaysTaken,
        `(${typeof currentDaysTaken})`
      );
      console.log(`  Increment:`, increment, `(${typeof increment})`);
      console.log(`  New value:`, newDaysTaken, `(${typeof newDaysTaken})`);

      // Calculate new RAG status using enhanced calculation
      const ragResult = await calculateEnhancedRagStatus(
        safeParseFloat(currentTask.days_assigned),
        newDaysTaken,
        currentTask.due_date,
        currentTask.assignee
      );

      // Determine the new status based on the updated values
      const newStatus = determineTaskStatus(
        newDaysTaken,
        safeParseFloat(currentTask.days_assigned),
        new Date() // Current time for the last update
      );

      // Create a complete update object that preserves all original values
      const updateData = {
        name: currentTask.name,
        projectId: currentTask.project_id,
        assignee: currentTask.assignee,
        status: newStatus, // Use the calculated status
        rag: ragResult.ragStatus,
        startDate: currentTask.start_date,
        dueDate: currentTask.due_date,
        daysAssigned: safeParseFloat(currentTask.days_assigned).toFixed(1),
        daysTaken: newDaysTaken.toFixed(1), // Ensure consistent format
        description: currentTask.description || '',
        tauNotes: currentTask.tau_notes || '',
        pathToGreen: currentTask.path_to_green || '',
        persona: currentTask.persona || '',
        subTaskName: currentTask.sub_task_name || '',
      };

      // Update the task
      await taskService.update(currentTask.id, updateData);

      // Update the task in local state to give immediate feedback
      const updatedTasks = tasks.map((t) => {
        if (t.id === currentTask.id) {
          return {
            ...t,
            days_taken: newDaysTaken,
            rag: ragResult.ragStatus,
            status: newStatus,
            last_updated_days: new Date().toISOString(),
            timeInfo: {
              ...t.timeInfo,
              daysRemaining: parseFloat(
                Math.max(
                  0,
                  safeParseFloat(t.days_assigned) - newDaysTaken
                ).toFixed(1)
              ),
              percentComplete:
                safeParseFloat(t.days_assigned) > 0
                  ? (newDaysTaken / safeParseFloat(t.days_assigned)) * 100
                  : 0,
              businessDaysUntilDue: ragResult.assigneeWorkingDays,
              buffer: ragResult.buffer,
              calculatedRag: ragResult.ragStatus,
              workingDaysPerWeek: ragResult.workingDaysPerWeek,
              holidayCount: ragResult.holidayCount,
            },
          };
        }
        return t;
      });

      // Update state without fetching
      setTasks(updatedTasks);

      showNotification(
        `Days taken ${
          increment > 0 ? 'increased' : 'decreased'
        } to ${newDaysTaken}. Status: ${newStatus}`
      );
    } catch (err) {
      console.error('Error updating days taken:', err);
      showNotification('Failed to update days taken', 'error');
      // If there was an error, fetch tasks to ensure accurate data
      fetchTasks();
    }
  };
  // Handler for the "Select All" checkbox
  const handleSelectAllTasks = (event) => {
    if (event.target.checked) {
      // Select all tasks (or all filtered tasks if filters are applied)
      const tasksToSelect = filteredTasks.length > 0 ? filteredTasks : tasks;
      setSelectedTasks(tasksToSelect.map((task) => task.id));
    } else {
      // Deselect all tasks
      setSelectedTasks([]);
    }
  };

  // Handler for individual task selection
  const handleSelectTask = (taskId, isSelected) => {
    if (isSelected) {
      setSelectedTasks((prev) => [...prev, taskId]);
    } else {
      setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleMassDelete = () => {
    setTaskToDelete(null); // Set to null to indicate mass delete mode
    setDeleteDialogOpen(true);
  };

  const getRagColor = (rag) => {
    switch (rag) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Not Started':
        return 'default';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Find persona label from value
  const getPersonaLabel = (value) => {
    const persona = PERSONA_OPTIONS.find((p) => p.value === value);
    return persona ? persona.label : '';
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const displayTasks = filteredTasks.length > 0 ? filteredTasks : tasks;

  // Custom row rendering function for the ResizableTable
  const renderRow = (task, columnWidths) => {
    // Return array of TableCell components for the task
    return columns.map((column) => {
      // Set the width from columnWidths or default
      const width = columnWidths[column.id] || column.width || 150;

      // Render appropriate cell based on column id
      switch (column.id) {
        case 'select':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <Checkbox
                checked={selectedTasks.includes(task.id)}
                onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                size="small"
                color="primary"
              />
            </TableCell>
          );

        case 'name':
          return (
            <TableCell
              key={column.id}
              sx={{
                width: width,
                maxWidth: width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.name}
              {task.description && (
                <Tooltip title={task.description} arrow>
                  <InfoOutlinedIcon
                    fontSize="small"
                    color="action"
                    sx={{ ml: 1, verticalAlign: 'middle' }}
                  />
                </Tooltip>
              )}
            </TableCell>
          );

        // Add the subTaskName case
        case 'subTaskName':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              {editingSubTaskName === task.id ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    value={subTaskNameValue}
                    onChange={(e) => setSubTaskNameValue(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Enter sub-task..."
                    autoFocus
                    onBlur={saveSubTaskName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveSubTaskName();
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box
                  onClick={() =>
                    handleSubTaskNameEdit(task.id, task.sub_task_name)
                  }
                  sx={{
                    cursor: 'pointer',
                    minHeight: '24px',
                    p: 1,
                    maxWidth: width - 16,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    },
                  }}
                >
                  {task.sub_task_name || (
                    <Typography variant="caption" color="text.secondary">
                      Click to add...
                    </Typography>
                  )}
                </Box>
              )}
            </TableCell>
          );
        case 'project':
          return (
            <TableCell
              key={column.id}
              sx={{
                width: width,
                maxWidth: width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.project_name}
            </TableCell>
          );

        case 'assignee':
          return (
            <TableCell
              key={column.id}
              sx={{
                width: width,
                maxWidth: width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.assignee}
            </TableCell>
          );

        case 'status':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <Chip
                label={task.status}
                color={getStatusColor(task.status)}
                size="small"
              />
            </TableCell>
          );

        case 'rag':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <Tooltip
                title={
                  task.timeInfo
                    ? `Buffer: ${task.timeInfo.buffer.toFixed(1)} working days.
                   ${task.timeInfo.daysRemaining} days of work remaining with 
                   ${task.timeInfo.businessDaysUntilDue.toFixed(
                     1
                   )} working days until due.
                   Assignee works ${
                     task.timeInfo.workingDaysPerWeek || 5
                   } days per week.
                   Holidays in period: ${task.timeInfo.holidayCount || 0}`
                    : 'RAG status'
                }
                arrow
              >
                <Chip
                  label={
                    task.timeInfo.calculatedRag === 1
                      ? 'Green'
                      : task.timeInfo.calculatedRag === 2
                      ? 'Amber'
                      : 'Red'
                  }
                  color={getRagColor(task.timeInfo.calculatedRag)}
                  size="small"
                />
              </Tooltip>
            </TableCell>
          );

        case 'persona':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <FormControl size="small" fullWidth>
                <Select
                  value={task.persona || ''}
                  onChange={(e) => handlePersonaChange(task.id, e.target.value)}
                  displayEmpty
                  size="small"
                  variant="outlined"
                  sx={{ maxWidth: width - 16 }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {PERSONA_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </TableCell>
          );

        case 'dueDate':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : '-'}
            </TableCell>
          );

        case 'timeUsage':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <TimeUsageDisplay
                      daysAssigned={task.days_assigned}
                      daysTaken={task.days_taken}
                      ragStatus={task.timeInfo.calculatedRag}
                    />
                  </Box>
                  {/* Quick update buttons */}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleQuickUpdateDaysTaken(task, 0.5)}
                    title="Add 0.5 days"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleQuickUpdateDaysTaken(task, -0.5)}
                    disabled={parseFloat(task.days_taken || 0) < 0.5}
                    title="Remove 0.5 days"
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>{' '}
                </Box>

                {/* Percentage complete */}
                <Typography variant="caption" color="text.secondary">
                  {task.timeInfo.percentComplete.toFixed(0)}% complete (
                  {task.days_taken || 0}/{task.days_assigned || 0} days)
                </Typography>
              </Box>
            </TableCell>
          );

        case 'pathToGreen':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              {editingPathToGreen === task.id ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    value={pathToGreenValue}
                    onChange={(e) => setPathToGreenValue(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter path to green..."
                    autoFocus
                    onBlur={savePathToGreen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        savePathToGreen();
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box
                  onClick={() =>
                    handlePathToGreenEdit(task.id, task.path_to_green)
                  }
                  sx={{
                    cursor: 'pointer',
                    minHeight: '24px',
                    p: 1,
                    maxWidth: width - 16,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    },
                  }}
                >
                  {task.path_to_green || (
                    <Typography variant="caption" color="text.secondary">
                      Click to add...
                    </Typography>
                  )}
                </Box>
              )}
            </TableCell>
          );

        case 'notes':
          return (
            <TableCell
              key={column.id}
              align="center"
              sx={{ width: width, maxWidth: width }}
            >
              <IconButton
                size="small"
                onClick={(e) => handleTauNotesClick(e, task)}
                color={task.tau_notes ? 'primary' : 'default'}
              >
                <NotesIcon />
              </IconButton>
            </TableCell>
          );

        case 'lastUpdated':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              {task.last_updated_days ? (
                <Tooltip
                  title={new Date(task.last_updated_days).toLocaleString()}
                >
                  <span>{timeAgo(new Date(task.last_updated_days))}</span>
                </Tooltip>
              ) : (
                'Never'
              )}
            </TableCell>
          );

        case 'actions':
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditForm(task)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleOpenDeleteDialog(task)}
                >
                  Delete
                </Button>
              </Stack>
            </TableCell>
          );

        default:
          return (
            <TableCell key={column.id} sx={{ width: width, maxWidth: width }}>
              {task[column.id]}
            </TableCell>
          );
      }
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Tasks
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={toggleFilters}
            color={filtersOpen ? 'primary' : 'default'}
          >
            Filters {filtersOpen ? '(Hide)' : '(Show)'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
          >
            Add Task
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            component={Link}
            to="/import"
            startIcon={<FileUploadIcon />}
          >
            Import Tasks
          </Button>
          {selectedTasks.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleMassDelete}
            >
              Delete Selected ({selectedTasks.length})
            </Button>
          )}
        </Stack>{' '}
      </Box>
      {/* Filter Panel */}
      <Collapse in={filtersOpen}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <TextField
                  label="Task Name"
                  variant="outlined"
                  fullWidth
                  value={filters.name}
                  onChange={handleFilterChange('name')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filters.name ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, name: '' }))
                          }
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="project-filter-label" shrink={true}>
                    Project
                  </InputLabel>
                  <Select
                    labelId="project-filter-label"
                    value={filters.project}
                    onChange={handleFilterChange('project')}
                    label="Project"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Projects</MenuItem>
                    {filterOptions.projects.map((project) => (
                      <MenuItem key={project} value={project}>
                        {project}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="assignee-filter-label" shrink={true}>
                    Assignee
                  </InputLabel>
                  <Select
                    labelId="assignee-filter-label"
                    value={filters.assignee}
                    onChange={handleFilterChange('assignee')}
                    label="Assignee"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Assignees</MenuItem>
                    {filterOptions.assignees.map((assignee) => (
                      <MenuItem key={assignee} value={assignee}>
                        {assignee}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="status-filter-label" shrink={true}>
                    Status
                  </InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={filters.status}
                    onChange={handleFilterChange('status')}
                    label="Status"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {filterOptions.statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="rag-filter-label" shrink={true}>
                    RAG Status
                  </InputLabel>
                  <Select
                    labelId="rag-filter-label"
                    value={filters.rag}
                    onChange={handleFilterChange('rag')}
                    label="RAG Status"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All RAG Statuses</MenuItem>
                    <MenuItem value="1">Green</MenuItem>
                    <MenuItem value="2">Amber</MenuItem>
                    <MenuItem value="3">Red</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={filters.dueDate}
                  onChange={handleFilterChange('dueDate')}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: filters.dueDate ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, dueDate: '' }))
                          }
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Box>

              {/* New Persona Filter */}
              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="persona-filter-label" shrink={true}>
                    Persona
                  </InputLabel>
                  <Select
                    labelId="persona-filter-label"
                    value={filters.persona}
                    onChange={handleFilterChange('persona')}
                    label="Persona"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Personas</MenuItem>
                    {PERSONA_OPTIONS.map((persona) => (
                      <MenuItem key={persona.value} value={persona.value}>
                        {persona.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Sub Task Name filter */}
              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <TextField
                  label="Sub Task"
                  variant="outlined"
                  fullWidth
                  value={filters.subTaskName}
                  onChange={handleFilterChange('subTaskName')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filters.subTaskName ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, subTaskName: '' }))
                          }
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Box>
              <Box
                sx={{
                  gridColumn: {
                    xs: 'span 12',
                    sm: 'span 6',
                    md: 'span 4',
                    lg: 'span 2',
                  },
                }}
              >
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All Filters
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Display filtered count if filtering is active */}
      {Object.values(filters).some((f) => f !== '' && f !== false) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </Typography>
        </Box>
      )}

      {!loading && tasks.length === 0 ? (
        <Typography>No tasks found. Create your first task!</Typography>
      ) : !loading &&
        filteredTasks.length === 0 &&
        Object.values(filters).some((f) => f !== '' && f !== false) ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No tasks match the current filters. Try adjusting your filter
          criteria.
        </Alert>
      ) : (
        // Replace the TableContainer with ResizableTable
        <Box
          sx={{
            width: '100%',
            height: 'calc(100vh - 250px)',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '100%', // Ensure it doesn't exceed container width
            mx: 0, // Remove any margins
          }}
        >
          <ResizableTable
            columns={columns}
            rows={displayTasks}
            renderRow={renderRow}
            storageKey="taskColumnWidths"
            defaultColumnWidth={150}
            onSort={handleSort}
            sx={{ width: '100%' }}
            selectedItems={selectedTasks}
            onSelectAll={handleSelectAllTasks}
            enableSelection={true}
          />
        </Box>
      )}
      {/* Tau Notes Popover */}
      <Popover
        open={Boolean(tauNotesAnchorEl)}
        anchorEl={tauNotesAnchorEl}
        onClose={handleTauNotesClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 350 }}>
          <Typography variant="h6" gutterBottom>
            Tau Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentTauNotes}
            onChange={(e) => setCurrentTauNotes(e.target.value)}
            placeholder="Enter notes here..."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleTauNotesClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={saveTauNotes}>
              Save
            </Button>
          </Box>
        </Box>
      </Popover>

      <TaskForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={currentTask}
        isEdit={isEditing}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteTask}
        title={taskToDelete ? 'Delete Task' : 'Delete Multiple Tasks'}
        content={
          taskToDelete
            ? `Are you sure you want to delete the task "${taskToDelete?.name}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedTasks.length} selected tasks? This action cannot be undone.`
        }
      />
    </Box>
  );
}

export default TasksPage;
