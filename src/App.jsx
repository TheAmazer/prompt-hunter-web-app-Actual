import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, UserCircle } from 'lucide-react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import ProfileView from './components/ProfileView';
import './index.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-container">
      <div className="content-area">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/hunt" element={<CameraView />} />
          <Route path="/profile" element={<ProfileView />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        <div
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Home />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${location.pathname === '/hunt' ? 'active' : ''}`}
          onClick={() => navigate('/hunt')}
        >
          <Camera />
          <span>Hunt</span>
        </div>

        <div
          className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <UserCircle />
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
