const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini API with explicit API key
const apiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, ''); // Remove quotes if present
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to generate chat response
async function generateResponse(prompt) {
  try {
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    console.log('Received response from Gemini API');
    const response = await result.response;
    const text = response.text();
    console.log('Response text extracted successfully');
    return text;
  } catch (error) {
    console.error('Detailed Gemini API Error:', {
      message: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    throw error;
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid message format. Message must be a non-empty string.' 
      });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured.' 
      });
    }

    console.log('Processing chat request:', { messageLength: message.length });
    const response = await generateResponse(message);
    
    if (!response) {
      return res.status(500).json({ 
        error: 'No response generated from AI.' 
      });
    }

    res.json({ response });
  } catch (error) {
    console.error('Server Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while processing your request.' 
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', {
    message: err.message,
    stack: err.stack
  });
  res.status(500).json({ 
    error: 'An unexpected error occurred on the server.' 
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API Key configured: ${apiKey ? 'Yes' : 'No'}`);
  console.log(`API Key length: ${apiKey?.length || 0}`);
}); 