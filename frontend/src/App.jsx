import { useState } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import SignUp from './pages/SignUp'
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";

import { AuthProvider, useAuth } from './context/AuthContext'
import SubDashboard from './pages/SubDashboard'
import SubjectPage from './pages/SubjectPage';

import JoinPage from './pages/JoinPage';

function AppRoutes(){

    const {user, loading} = useAuth();

    if(loading){
      return <div>Loading...</div>;
    }

    return(
    
      <Routes>
            {/* it would only shown when when loading is over, will show log in, sign up, subject page*/}

            <Route path="/" element={user ? <SubDashboard/> : <Navigate to="/login"/>}/>

            <Route path="/subject/:subjectId" element={user ? <SubjectPage/> : <Navigate to="/login"/>}/>

            <Route path="/login" element={!user ? <LoginPage/> : <Navigate to="/"/>}/>

            <Route path="/signup" element={!user ? <SignUp/> : <Navigate to="/"/>}/>

            <Route path="/join/:token" element={user ? <JoinPage/> : <Navigate to="/login" />}/>

      </Routes>

    );
}


function App() {
  
  return (
    <>
      <AuthProvider>
        <Router>
            <AppRoutes/>
        </Router>
      </AuthProvider> 
      
    </>
  )
}

export default App;
