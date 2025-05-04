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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { projectService } from '../services/api';
import ProjectForm from '../components/projects/ProjectForm';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  // Add console log to check state
  console.log('Form open state:', openForm);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects');
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
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleOpenForm = () => {
    console.log('Opening form...');
    setOpenForm(true);
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

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Project
        </Button>
      </Box>

      {error ? (
        <Alert severity="error">Error: {error}</Alert>
      ) : projects.length === 0 ? (
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
                  <TableCell>{project.name}</TableCell>{' '}
                  {/* This will now work */}
                  <TableCell>{project.company}</TableCell>{' '}
                  {/* This will now work */}
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
                    <Button size="small">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ProjectForm
        open={openForm}
        onClose={() => {
          console.log('Closing form...');
          setOpenForm(false);
        }}
        onSubmit={handleCreateProject}
      />
    </Box>
  );
}

export default ProjectsPage;
