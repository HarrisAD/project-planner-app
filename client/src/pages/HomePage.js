import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import { projectService } from '../services/api';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === 'In Progress' || p.status === 'Active'
    ).length;
    const atRiskProjects = projects.filter(
      (p) => p.rag === 2 || p.rag === 3
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === 'Completed'
    ).length;

    return { totalProjects, activeProjects, atRiskProjects, completedProjects };
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const metrics = getMetrics();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Project Planning Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Last refreshed: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h3">{metrics.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3" color="primary">
                {metrics.activeProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                At Risk
              </Typography>
              <Typography variant="h3" color="warning.main">
                {metrics.atRiskProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h3" color="success.main">
                {metrics.completedProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Summary Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Project Summary
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>RAG</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name || project.workstream}</TableCell>
                  <TableCell>
                    {project.company || project.company_name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        project.rag === 1
                          ? 'Green'
                          : project.rag === 2
                          ? 'Amber'
                          : 'Red'
                      }
                      color={getRagColor(project.rag)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <Box
                          sx={{
                            height: 10,
                            backgroundColor: 'grey.200',
                            borderRadius: 5,
                          }}
                        >
                          <Box
                            sx={{
                              height: 10,
                              backgroundColor: 'primary.main',
                              borderRadius: 5,
                              width: `${(project.progress || 0) * 100}%`,
                            }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round((project.progress || 0) * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{project.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default HomePage;
