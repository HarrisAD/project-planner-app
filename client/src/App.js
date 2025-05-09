import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import ApiTestPage from './pages/ApiTestPage';
import { NotificationProvider } from './context/NotificationContext';
import AssigneesPage from './pages/AssigneesPage';
import ResourcesPage from './pages/ResourcesPage';
import ImportPage from './pages/ImportPage'; // Add this import

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="assignees" element={<AssigneesPage />} />
            <Route path="test" element={<ApiTestPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
export default App;
