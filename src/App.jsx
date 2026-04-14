import { useState, Component } from 'react';
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

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Page crash:', error, info.componentStack);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.pageKey !== this.props.pageKey) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ maxWidth: 700, margin: '80px auto', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: 12, color: '#dc2626' }}>
            Something went wrong
          </div>
          <pre style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left', background: '#f8fafc', padding: 16, borderRadius: 8 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const CurrentPage = PAGES[activePage] || Dashboard;

  return (
    <>
      <Header active={activePage} onNavigate={setActivePage} />
      <PageErrorBoundary pageKey={activePage}>
        <CurrentPage />
      </PageErrorBoundary>
    </>
  );
}

export default App;
