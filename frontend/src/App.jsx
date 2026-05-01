import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Bell, Settings, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import './index.css';
import './App.css';

const API_URL = 'http://localhost:5000/api/alarms';

function App() {
  const [time, setTime] = useState(new Date());
  const [theme, setTheme] = useState('dark');
  const [is24Hour, setIs24Hour] = useState(false);
  const [showAlarms, setShowAlarms] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [activeAlarm, setActiveAlarm] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      checkAlarms(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms]);

  useEffect(() => {
    fetchAlarms();
  }, []);

  const fetchAlarms = async () => {
    try {
      const res = await axios.get(API_URL);
      setAlarms(res.data);
    } catch (error) {
      console.error("Error fetching alarms:", error);
    }
  };

  const checkAlarms = (currentTime) => {
    const currentHours = currentTime.getHours().toString().padStart(2, '0');
    const currentMinutes = currentTime.getMinutes().toString().padStart(2, '0');
    const currentSeconds = currentTime.getSeconds();
    
    // Only trigger exactly when seconds is 0
    if (currentSeconds === 0) {
      const timeString = `${currentHours}:${currentMinutes}`;
      const triggered = alarms.find(a => a.time === timeString && a.isActive);
      if (triggered) {
        setActiveAlarm(triggered);
        // Play sound could go here
      }
    }
  };

  const addAlarm = async (e) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    try {
      const res = await axios.post(API_URL, {
        time: newAlarmTime,
        label: newAlarmLabel || 'Alarm'
      });
      setAlarms([...alarms, res.data]);
      setNewAlarmTime('');
      setNewAlarmLabel('');
    } catch (error) {
      console.error("Error adding alarm:", error);
    }
  };

  const deleteAlarm = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setAlarms(alarms.filter(a => a._id !== id));
    } catch (error) {
      console.error("Error deleting alarm:", error);
    }
  };

  const toggleAlarm = async (id, currentStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/${id}`, { isActive: !currentStatus });
      setAlarms(alarms.map(a => a._id === id ? res.data : a));
    } catch (error) {
      console.error("Error toggling alarm:", error);
    }
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (!is24Hour) {
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
    }
    
    return {
      time: `${hours.toString().padStart(2, '0')}:${minutes}`,
      seconds,
      ampm: is24Hour ? '' : ampm
    };
  };

  const timeData = formatTime(time);

  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel main-clock"
      >
        <div className="controls top-controls">
          <button className="icon-btn" onClick={() => setIs24Hour(!is24Hour)} title="Toggle 12/24 Hour">
            <Settings size={20} />
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="clock-display">
          <motion.div 
            key={timeData.time}
            initial={{ opacity: 0.8, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="time"
          >
            {timeData.time}
          </motion.div>
          <div className="time-details">
            <span className="seconds">{timeData.seconds}</span>
            {!is24Hour && <span className="ampm">{timeData.ampm}</span>}
          </div>
        </div>

        <div className="date-display">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div className="controls bottom-controls">
          <button 
            className={`icon-btn action-btn ${showAlarms ? 'active' : ''}`}
            onClick={() => setShowAlarms(!showAlarms)}
          >
            <Bell size={24} />
            {alarms.filter(a => a.isActive).length > 0 && (
              <span className="badge">{alarms.filter(a => a.isActive).length}</span>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAlarms && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-panel alarms-panel"
          >
            <h3>Alarms</h3>
            
            <form onSubmit={addAlarm} className="add-alarm-form">
              <input 
                type="time" 
                value={newAlarmTime} 
                onChange={e => setNewAlarmTime(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Label" 
                value={newAlarmLabel}
                onChange={e => setNewAlarmLabel(e.target.value)}
              />
              <button type="submit" className="primary-btn">
                <Plus size={18} />
              </button>
            </form>

            <div className="alarms-list">
              {alarms.length === 0 ? (
                <p className="no-alarms">No alarms set</p>
              ) : (
                alarms.map(alarm => (
                  <motion.div 
                    layout
                    key={alarm._id} 
                    className={`alarm-item ${!alarm.isActive ? 'disabled' : ''}`}
                  >
                    <div className="alarm-info">
                      <h4>{alarm.time}</h4>
                      <p>{alarm.label}</p>
                    </div>
                    <div className="alarm-actions">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={alarm.isActive}
                          onChange={() => toggleAlarm(alarm._id, alarm.isActive)}
                        />
                        <span className="slider round"></span>
                      </label>
                      <button onClick={() => deleteAlarm(alarm._id)} className="delete-btn">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAlarm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="glass-panel alarm-modal"
          >
            <div className="ringing-bell">
              <Bell size={48} className="shake" />
            </div>
            <h2>Alarm Ringing!</h2>
            <h1>{activeAlarm.time}</h1>
            <p>{activeAlarm.label}</p>
            <button className="primary-btn block-btn" onClick={() => setActiveAlarm(null)}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
