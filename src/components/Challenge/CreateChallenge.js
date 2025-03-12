import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { createChallenge } from '../../services/firestoreService';
import '../../styles/colors.css';
import '../../styles/components.css';
import '../../styles/createChallenge.css';

const CreateChallenge = () => {
  const { user, refreshActiveChallenge } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fastingType, setFastingType] = useState('16:8');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate default dates (today and 7 days from now)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Format date as YYYY-MM-DD for input[type="date"]
  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Set default dates on component mount
  useEffect(() => {
    setStartDate(formatDate(today));
    setEndDate(formatDate(nextWeek));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !description || !startDate || !endDate || !fastingType) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create challenge in Firestore
      await createChallenge(
        name,
        description,
        startDate,
        endDate,
        fastingType,
        user.uid
      );

      // Refresh active challenge data
      await refreshActiveChallenge();

      // Navigate back to the friends tab
      navigate('/friends');
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/friends');
  };

  return (
    <div className="challenge-form-container">
      <h2>Create a New Challenge</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group form-group">
          <label htmlFor="name">Challenge Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., 7-Day Fasting Challenge"
            required
          />
        </div>

        <div className="input-group form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the rules and goals of this challenge..."
            rows="4"
            required
          ></textarea>
        </div>

        <div className="input-group form-group">
          <label htmlFor="fastingType">Fasting Type:</label>
          <select
            id="fastingType"
            value={fastingType}
            onChange={(e) => setFastingType(e.target.value)}
            required
          >
            <option value="16:8">16:8 (16 hours fasting, 8 hours eating)</option>
            <option value="OMAD">OMAD (One Meal A Day)</option>
            <option value="Long fast">Long Fast (24+ hours)</option>
          </select>
        </div>

        <div className="form-row">
          <div className="input-group half">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={formatDate(today)}
              required
            />
          </div>

          <div className="input-group half">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="secondary-button"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChallenge;