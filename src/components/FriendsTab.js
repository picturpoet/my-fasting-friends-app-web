import React from 'react';

function FriendsTab() {
  const [challengeStatus, setChallengeStatus] = React.useState('empty'); // 'empty', 'pending', 'active'
  const [challengeStartDate, setChallengeStartDate] = React.useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [leaderboardData, setLeaderboardData] = React.useState([
    { name: 'User 1', progress: 80, status: 'onTrack' },
    { name: 'User 2', progress: 60, status: 'lagging' },
    { name: 'User 3', progress: 40, status: 'offTrack' },
  ]);

  const ChallengeCountdown = ({ startDate }) => {
    const [timeRemaining, setTimeRemaining] = React.useState(getTimeRemaining(startDate));

    React.useEffect(() => {
      const intervalId = setInterval(() => {
        setTimeRemaining(getTimeRemaining(startDate));
      }, 1000); // Update every second

      return () => clearInterval(intervalId); // Clean up the interval on unmount
    }, [startDate]);

    function getTimeRemaining(startDate)
    {
      const total = Date.parse(startDate) - Date.parse(new Date());
      const seconds = Math.floor( (total/1000) % 60 );
      const minutes = Math.floor( (total/1000/60) % 60 );
      const hours = Math.floor( (total/(1000*60*60)) % 24 );
      const days = Math.floor( total/(1000*60*60*24) );
      return {
        total,
        days,
        hours,
        minutes,
        seconds
      };
    }

    return (
      <div>
        Starts in {timeRemaining.days} days, {timeRemaining.hours} hours, {timeRemaining.minutes} minutes, {timeRemaining.seconds} seconds!
      </div>
    );
  };

  const LeaderboardItem = ({ name, progress, status }) => {
    let statusIcon = '🟢';
    if (status === 'lagging') {
      statusIcon = '🟡';
    } else if (status === 'offTrack') {
      statusIcon = '🔴';
    }

    return (
      <div>
        {name} - {progress}% {statusIcon}
      </div>
    );
  };

  const Leaderboard = ({ leaderboardData }) => {
    return (
      <div>
        {leaderboardData.map((user, index) => (
          <LeaderboardItem
            key={index}
            name={user.name}
            progress={user.progress}
            status={user.status}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2>Friends Tab</h2>
      {challengeStatus === 'empty' && (
        <div>
          <p>Invite friends via WhatsApp!</p>
          <button>Invite via WhatsApp</button> {/* Placeholder */}
        </div>
      )}
      {challengeStatus === 'pending' && (
        <ChallengeCountdown startDate={challengeStartDate} />
      )}
      {challengeStatus === 'active' && (
        <Leaderboard leaderboardData={leaderboardData} />
      )}
    </div>
  );
}

export default FriendsTab;