const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generation_config: { response_mime_type: 'application/json' }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.array('files'), async (req, res) => {
  console.log('Files uploaded:', req.files);
  try {
    const prompt = fs.readFileSync('prompt.txt', 'utf-8');
    

    const images = req.files.map(file => {
      console.log(`Processing file: ${file.path}`);
      return {
        inlineData: {
          data: fs.readFileSync(file.path).toString('base64'),
          mimeType: file.mimetype,
        },
      };
    });

    const result = await model.generateContent([prompt, ...images]);
    console.log('AI response:', result.response.text());

    req.files.forEach(file => fs.unlinkSync(file.path)); // Clean up the uploaded files
    res.json({ rating: result.response.text() });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});