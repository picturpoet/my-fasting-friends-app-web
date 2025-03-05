import React from 'react';
import FastTab from './components/FastTab';
import FriendsTab from './components/FriendsTab';
import MeTab from './components/MeTab';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = React.useState('fast');

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Fasting Friends</h1>
      </header>
      <main>
        {activeTab === 'fast' && <FastTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'me' && <MeTab />}
      </main>
      <nav className="bottom-nav">
        <button
          className={activeTab === 'fast' ? 'active' : ''}
          onClick={() => setActiveTab('fast')}
        >
          Fast
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button
          className={activeTab === 'me' ? 'active' : ''}
          onClick={() => setActiveTab('me')}
        >
          Me
        </button>
      </nav>
    </div>
  );
}

export default App;
