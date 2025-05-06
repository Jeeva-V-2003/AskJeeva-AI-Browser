const { exec } = require('child_process');
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const port = 3000;
const app = express();
const server = require('http').createServer(app);
server.timeout = 0;  // No timeout (wait indefinitely)
const OLLAMA_MODEL = "mistral"; // Change to "gemma" if you downloaded it
const OLLAMA_API_URL = "http://localhost:11434/api/generate";


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

app.use('/uploads', express.static('uploads'));

// ✅ AI-powered suggestions
app.get("/suggest", async (req, res) => {
    let query = req.query.q;
    if (!query) {
        return res.json({ suggestions: [] });
    }

    try {
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: OLLAMA_MODEL,
                prompt: `Suggest 5 smart search queries based on: ${query}`,
                stream: false
            }
        );

        let suggestions = response.data.response.split("\n").filter(s => s);
        res.json({ suggestions });

    } catch (error) {
        console.error("Ollama Error:", error);
        res.json({ suggestions: [] });
    }
});

// ✅ AI-powered search response with better error handling
app.get("/search", async (req, res) => {
    let query = req.query.query;
    if (!query) {
        return res.status(400).json({ answer: "No query provided." });
    }

    try {
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: OLLAMA_MODEL,
                prompt: `Answer this directly: ${query}`,
                stream: false
            }
        );

        let answer = response.data.response;
        res.json({ answer });

    } catch (error) {
        console.error("AI Search Error:", error);

        let errorMessage = "I couldn't process that. Try searching on Google.";
        if (error.response) {
            errorMessage += ` [Ollama Error: ${error.response.status}]`;
        }

        res.json({
            answer: errorMessage,
            redirect: `https://www.google.com/search?q=${encodeURIComponent(query)}`
        });
    }
});


app.post('/analyze-video', upload.single('video'), (req, res) => {
    console.log("Received request for video analysis...");

    if (!req.file) {
        console.log("No video uploaded.");
        return res.status(400).send('No video uploaded.');
    }

    const videoPath = path.join(__dirname, 'uploads', req.file.filename);
    console.log(`Video saved at: ${videoPath}`);

    const pythonCmd = `python video-summary.py "${videoPath}"`;
    console.log(`Executing command: ${pythonCmd}`);

    exec(pythonCmd, (error, stdout, stderr) => {
        console.log("Execution completed.");

        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({ error: `Error processing video: ${error.message}` });
        }

        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }

        // ✅ Filter out unwanted progress logs from Python output
        const cleanOutput = stdout
            .split('\n')                // Split by lines
            .filter(line => !line.includes('chunk') && line.trim() !== '')  // Remove progress logs
            .join('\n');                // Join remaining lines

        console.log(`Filtered Output: ${cleanOutput}`);

        // ✅ Send clean output as the summary
        res.json({ summary: cleanOutput.trim() });

        // ✅ Cleanup files
        fs.unlink(videoPath, (err) => {
            if (err) {
                console.error(`Failed to delete video: ${err}`);
            } else {
                console.log(`Deleted video: ${videoPath}`);
            }
        });

        const audioPath = path.join(__dirname, 'temp_audio.wav');
        if (fs.existsSync(audioPath)) {
            fs.unlink(audioPath, (err) => {
                if (err) {
                    console.error(`Failed to delete audio: ${err}`);
                } else {
                    console.log(`Deleted audio: ${audioPath}`);
                }
            });
        }
    });
});
server.listen(port, () => {
    console.log(`AI Browser server is running on port ${port}...`);
});