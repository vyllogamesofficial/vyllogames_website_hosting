import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './components/HomePage/HomePage';
import GameDetail from './components/GameDetail/GameDetail';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import GameForm from './components/Admin/GameForm';
import ProtectedRoute from './components/Admin/ProtectedRoute';

import styles from './App.module.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className={styles.app}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:id" element={<GameDetail />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/games/new" 
              element={
                <ProtectedRoute>
                  <GameForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/games/edit/:id" 
              element={
                <ProtectedRoute>
                  <GameForm />
                </ProtectedRoute>
              } 
            />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
