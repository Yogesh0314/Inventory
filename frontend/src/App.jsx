import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive refetching
      retry: 1,
    },
  },
});

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';

// Main authenticated shell layout component
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-darkBg text-primaryText relative">
      {/* Sidebar drawer fixed */}
      <Sidebar />

      {/* Main scrolling viewport container */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header />
        
        {/* Dynamic page contents mounted here */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* Protected Main Application Layouts */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Products />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/suppliers" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Suppliers />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Transactions />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Users />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/audit-log" 
                  element={
                    <ProtectedRoute adminOnly>
                      <DashboardLayout>
                        <AuditLog />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all fallback router */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
   </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
