import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectService, taskService } from '../services/api';
import ProjectForm from '../components/projects/ProjectForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { showNotification } = useNotification();

  // Calculate resource allocation from tasks for all projects
  const calculateResourceAllocation = async (projects) => {
    try {
      // Fetch all tasks
      const response = await taskService.getAll();
      const allTasks = response.data;

      // Create a map to store allocation data by project
      const projectAllocations = {};

      // Initialize allocation data for each project
      projects.forEach((project) => {
        projectAllocations[project.id] = {
          exec_sponsor_assigned: 0,
          exec_sponsor_used: 0,
          exec_lead_assigned: 0,
          exec_lead_used: 0,
          developer_assigned: 0,
          developer_used: 0,
          consultant_assigned: 0,
          consultant_used: 0,
          programme_manager_assigned: 0,
          programme_manager_used: 0,
          total_assigned: 0,
          total_used: 0,
        };
      });

      // Calculate allocations from tasks
      allTasks.forEach((task) => {
        // Skip if no project ID
        if (!task.project_id) return;

        // Get allocation data for this project
        const allocation = projectAllocations[task.project_id];
        if (!allocation) return;

        // Add task data to appropriate persona category
        const daysAssigned = Number(task.days_assigned) || 0;
        const daysTaken = Number(task.days_taken) || 0;

        // Always add to project totals
        allocation.total_assigned += daysAssigned;
        allocation.total_used += daysTaken;

        // Also add to persona-specific totals if persona is defined
        if (task.persona) {
          switch (task.persona) {
            case 'exec_sponsor':
              allocation.exec_sponsor_assigned += daysAssigned;
              allocation.exec_sponsor_used += daysTaken;
              break;
            case 'exec_lead':
              allocation.exec_lead_assigned += daysAssigned;
              allocation.exec_lead_used += daysTaken;
              break;
            case 'developer':
              allocation.developer_assigned += daysAssigned;
              allocation.developer_used += daysTaken;
              break;
            case 'consultant':
              allocation.consultant_assigned += daysAssigned;
              allocation.consultant_used += daysTaken;
              break;
            case 'programme_manager':
              allocation.programme_manager_assigned += daysAssigned;
              allocation.programme_manager_used += daysTaken;
              break;
            default:
              // If an unknown persona type is encountered, just add it to the total
              console.log(`Unknown persona type encountered: ${task.persona}`);
              // You can choose to either ignore it or add to totals only
              allocation.total_assigned += daysAssigned;
              allocation.total_used += daysTaken;
              break;
          }
        }
      });

      // For debugging
      console.log('Allocation data:', projectAllocations);

      // Merge allocation data into projects and calculate new progress
      return projects.map((project) => {
        const allocation = projectAllocations[project.id];

        // Calculate progress as percentage of total days used / assigned
        let newProgress = 0;
        if (allocation.total_assigned > 0) {
          newProgress = allocation.total_used / allocation.total_assigned;
        }

        console.log(
          `Project ${project.id} total: ${allocation.total_used}/${allocation.total_assigned}, progress: ${newProgress}`
        );

        return {
          ...project,
          ...allocation,
          progress: newProgress, // Override the original progress with our calculation
        };
      });
    } catch (error) {
      console.error('Error calculating resource allocation:', error);
      return projects; // Return original projects if calculation fails
    }
  };
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll();

      // Calculate resource allocation for projects
      const projectsWithAllocation = await calculateResourceAllocation(
        response.data
      );

      setProjects(projectsWithAllocation);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
      showNotification('Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleCreateProject = async (projectData) => {
    try {
      await projectService.create(projectData);
      fetchProjects(); // Refresh the list
      setOpenForm(false);
      showNotification('Project created successfully');
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project');
      showNotification('Failed to create project', 'error');
    }
  };

  const handleUpdateProject = async (projectData) => {
    try {
      if (!currentProject) return;

      await projectService.update(currentProject.id, projectData);
      fetchProjects(); // Refresh the list
      setOpenForm(false);
      setCurrentProject(null);
      setIsEditing(false);
      showNotification('Project updated successfully');
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.error || 'Failed to update project');
      showNotification('Failed to update project', 'error');
    }
  };

  const handleOpenCreateForm = () => {
    setCurrentProject(null);
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEditForm = (project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentProject(null);
    setIsEditing(false);
  };

  const handleFormSubmit = (data) => {
    if (isEditing) {
      handleUpdateProject(data);
    } else {
      handleCreateProject(data);
    }
  };

  const handleOpenDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleDeleteProject = async () => {
    try {
      if (!projectToDelete) return;

      await projectService.delete(projectToDelete.id);
      fetchProjects(); // Refresh the list
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      showNotification('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.error || 'Failed to delete project');
      showNotification('Failed to delete project', 'error');
    }
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

  const getRagLabel = (rag) => {
    switch (rag) {
      case 1:
        return 'Green';
      case 2:
        return 'Amber';
      case 3:
        return 'Red';
      default:
        return 'Unknown';
    }
  };

  // Helper function to render resource allocation cell
  const renderResourceAllocation = (assigned, used) => {
    const assignedValue = Math.round(assigned || 0);
    const usedValue = Math.round(used || 0);

    // If no days assigned, show "N/A" instead of a progress bar
    if (assignedValue === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          N/A
        </Typography>
      );
    }

    // Otherwise, show the normal progress bar
    const percentage = (usedValue / assignedValue) * 100;

    return (
      <Tooltip
        title={`${usedValue} of ${assignedValue} days used (${Math.round(
          percentage
        )}%)`}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">
              {usedValue}/{assignedValue}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, percentage)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Tooltip>
    );
  };
  // Helper function to render total days without progress bar
  const renderTotalDays = (assigned, used) => {
    const assignedValue = Math.round(assigned || 0);
    const usedValue = Math.round(used || 0);

    return (
      <Tooltip
        title={`${usedValue} of ${assignedValue} total days used across all personas`}
      >
        <Typography variant="body2">
          {usedValue}/{assignedValue}
        </Typography>
      </Tooltip>
    );
  };

  if (loading && projects.length === 0) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
        >
          Add Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && projects.length === 0 ? (
        <Typography>No projects found. Create your first project!</Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ overflow: 'auto', maxWidth: '100%' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Project Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>RAG</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Exec Sponsor</TableCell>
                <TableCell>Exec Lead</TableCell>
                <TableCell>Developer</TableCell>
                <TableCell>Consultant</TableCell>
                <TableCell>Programme Manager</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.company}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description || '—'}</TableCell>
                  <TableCell>{project.status}</TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.round((project.progress || 0) * 100)
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, textAlign: 'center' }}
                      >
                        {Math.round((project.progress || 0) * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRagLabel(project.rag)}
                      color={getRagColor(project.rag)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {renderTotalDays(
                      project.total_assigned,
                      project.total_used
                    )}
                  </TableCell>
                  <TableCell>
                    {renderResourceAllocation(
                      project.exec_sponsor_assigned,
                      project.exec_sponsor_used
                    )}
                  </TableCell>
                  <TableCell>
                    {renderResourceAllocation(
                      project.exec_lead_assigned,
                      project.exec_lead_used
                    )}
                  </TableCell>
                  <TableCell>
                    {renderResourceAllocation(
                      project.developer_assigned,
                      project.developer_used
                    )}
                  </TableCell>
                  <TableCell>
                    {renderResourceAllocation(
                      project.consultant_assigned,
                      project.consultant_used
                    )}
                  </TableCell>
                  <TableCell>
                    {renderResourceAllocation(
                      project.programme_manager_assigned,
                      project.programme_manager_used
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditForm(project)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(project)}
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

      <ProjectForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={currentProject}
        isEdit={isEditing}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        content={`Are you sure you want to delete the project "${projectToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
}

export default ProjectsPage;
