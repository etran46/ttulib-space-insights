import { useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Underutilized from './pages/Underutilized.jsx';
import CompareSpaces from './pages/CompareSpaces.jsx';
import Historical from './pages/Historical.jsx';
import PatronGuidance from './pages/PatronGuidance.jsx';

const PAGES = {
  Dashboard,
  Underutilized,
  CompareSpaces,
  Historical,
  PatronGuidance,
};

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const CurrentPage = PAGES[activePage] || Dashboard;

  return (
    <>
      <Header active={activePage} onNavigate={setActivePage} />
      <CurrentPage />
    </>
  );
}

export default App;

