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
    You are an assistant for an insurtech firm. READ THE INSURANCE POLICY GIVEN TO YOU AND CREATE A REPORT WITH ALL THE QUESTIONS I WILL ASK - STICK TO BULLET POINTS WITH EXACT ANSWERS.

Please find out what Category this policy comes under - Property, Liability, Employee Benefit
Please find out what product this policy is - Business Suraksha Shop, Fire Insurance Shop, Bharat Grih Raksha, Bharat Sukshma Udyam Suraksha, Business Suraksha Laghu, IAR, MEGA ALL Risk
Please find the Quote Renewal tenure
Please find the sum insured
Please find the type of Shop

Please also give me the sum insured split for these parameters:
- Building
- Office Equipment, Furnitures & Fixtures, Electrical Installation and other contents
- Furniture, Fixtures, Fittings
- Electrical Installation & Domestic Appliances
- Stocks
- Other Items
- Utensils
- Personal Effects
- Other Misc Items
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
    const aiResponse = result.response.text();

    // Write AI response to a text file
    const responseFilePath = 'uploads/response.txt';
    fs.writeFileSync(responseFilePath, aiResponse);

    // Clean up the uploaded files
    req.files.forEach(file => fs.unlinkSync(file.path));

    
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
