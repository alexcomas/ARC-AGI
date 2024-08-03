const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;
const classificationsFile = path.join(__dirname, 'classifications.json');
const settingsFile = path.join(__dirname, 'settings.json');

app.use(cors());
app.use(express.json());
app.use(express.static('apps'));

// Function to ensure the classifications file exists
async function ensureClassificationsFile() {
    try {
        await fs.access(classificationsFile);
    } catch (error) {
        await fs.writeFile(classificationsFile, '[]', 'utf8');
        console.log('Classifications file created');
    }
}

// Endpoint to fetch dropdown options
app.get('/dropdown_options', async (req, res) => {
    try {
        let data = await fs.readFile(settingsFile, 'utf8');
        let settings = JSON.parse(data);
        res.json(settings.taskClasses);
    } catch (error) {
        console.error('Error reading settings file:', error);
        res.status(500).json({ message: 'Error fetching dropdown options' });
    }
});

app.post('/save_classification', async (req, res) => {
    console.log('Received request to save classification');
    let newClassification = req.body;

    try {
        await ensureClassificationsFile();

        let data = await fs.readFile(classificationsFile, 'utf8');
        let classifications = JSON.parse(data);

        // Check if the classification for the task already exists and update it
        let existingIndex = classifications.findIndex(c => c.task === newClassification.task);
        if (existingIndex !== -1) {
            classifications[existingIndex] = newClassification;
            console.log('Classification updated');
        } else {
            classifications.push(newClassification);
            console.log('Classification added');
        }

        await fs.writeFile(classificationsFile, JSON.stringify(classifications, null, 2));
        res.send('Classification saved');
    } catch (error) {
        console.error('Error saving classification:', error);
        res.status(500).send('Error saving classification');
    }
});

app.get('/check_classification/:task', async (req, res) => {
    console.log('Received request to check classification for task:', req.params.task);
    let task = req.params.task;

    try {
        await ensureClassificationsFile();

        let data = await fs.readFile(classificationsFile, 'utf8');
        let classifications = JSON.parse(data);
        let classification = classifications.find(c => c.task === task);

        if (classification) {
            console.log('Classification found:', classification);
            res.json({ message: 'This task has already been classified', classification: classification.classification });
        } else {
            console.log('No classification found for task:', task);
            res.json({ message: 'This task has not been classified', classification: null });
        }
    } catch (error) {
        console.error('Error reading classifications file:', error);
        res.status(500).json({ message: 'Error checking classification', classification: null });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
