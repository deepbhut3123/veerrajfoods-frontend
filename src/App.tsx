import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Master from './MasterLayout/Master';
import { AdminRoutes } from './Route';
import './App.css';
import './index.css';
// import NotFound from './Components/NotFound';
import Login from './Auth/Login';
import { AuthProvider } from './Auth/AuthContext';
import Register from './Auth/Register';
import PrivateRoute from './Auth/privateRoute';
import Dashboard from './DesignLayout/Dashboard';
import "antd/dist/reset.css"; // for AntD v5+
// import Notifications from './Pages/Notification';
// import { SettingsProvider } from './Pages/Settings/SettingContext';

const App: React.FC = () => {

  const token = localStorage.getItem('token');

  return (
    <>
 <AuthProvider>
   {/* <SettingsProvider> */}
      {/* <Notifications /> */}
      <BrowserRouter>     

        <Routes>
        <Route path="*" element={<Navigate replace to="/login" />} />
          <Route path='/login' element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute  children={<Dashboard />} />}>
            {AdminRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<Master children={<route.component />} />}
                />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
      {/* </SettingsProvider> */}
      </AuthProvider>
    </>
  );
}

export default App;
