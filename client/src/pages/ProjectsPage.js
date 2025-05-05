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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectService } from '../services/api';
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll();
      setProjects(response.data);
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>RAG</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.company}</TableCell>
                  <TableCell>{project.status}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRagLabel(project.rag)}
                      color={getRagColor(project.rag)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {Math.round((project.progress || 0) * 100)}%
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
