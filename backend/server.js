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
    const prompt = `
  1. Create an email summary of this document - (It should include Below details)	

Policy Number 
IC name - this will be policy servicing office name
Product name
Policy Tenure
Overall Sum insured -  Is there is multilocation all together
Locations - Total no of locations	
Occupancy - Business of the Insured
coverage section like - Fire and Special Perils and Burglary
Premium details 

2. Please find the Terms and Conditions

3. Please find the deductible/Excess

4. please find clauses warranties

5. Please find the Name of the Insured and Communication Address

6. Please find the Hypothecation Details - Financial Interest, Financier Interest & Hypothecation Details

7. Please find the Intermediary Details	- Intermediary Name/ Agency/Broker Name, Intermediary Code/Agency/Broker Code, Agent's/Broker's Mobile, Intermediary Mobile No/ Intermediary Email ID, Agent's/Broker's Email ID

8. Please find the perils covered - Standard Fire and Special Perils

9. Please Find the Addon Covers - Like (STFI, Earthquake, 

10. Please find the Co-insurance Details - If 1 or many

A -Insurer Name/Name of the company & Location & Share Percentage & Office Code	
B -Insurer Name/Name of the company & Location & Share Percentage & Office Code
C -Insurer Name/Name of the company & Location & Share Percentage & Office Code

11. Please find the premium details with GST

12. please find the commission% and brokerage 

    `;
    

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