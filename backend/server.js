const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital-clock')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Alarm Schema
const alarmSchema = new mongoose.Schema({
    time: { type: String, required: true }, // Format HH:MM
    label: { type: String, default: 'Alarm' },
    isActive: { type: Boolean, default: true },
});

const Alarm = mongoose.model('Alarm', alarmSchema);

// Routes
app.get('/api/alarms', async (req, res) => {
    try {
        const alarms = await Alarm.find();
        res.json(alarms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/alarms', async (req, res) => {
    const alarm = new Alarm({
        time: req.body.time,
        label: req.body.label,
    });
    try {
        const newAlarm = await alarm.save();
        res.status(201).json(newAlarm);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/alarms/:id', async (req, res) => {
    try {
        await Alarm.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alarm deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/alarms/:id', async (req, res) => {
    try {
        const alarm = await Alarm.findById(req.params.id);
        if (req.body.isActive !== undefined) {
            alarm.isActive = req.body.isActive;
        }
        const updatedAlarm = await alarm.save();
        res.json(updatedAlarm);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
