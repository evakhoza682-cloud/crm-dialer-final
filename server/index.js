const express = require('express'); 
const cors = require('cors'); 
const Database = require('better-sqlite3'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const dotenv = require('dotenv'); 
const twilio = require('twilio'); 
const http = require('http'); 
const socketIo = require('socket.io'); 
 
dotenv.config(); 
 
const app = express(); 
const server = http.createServer(app); 
const io = socketIo(server, { cors: { origin: "*" } }); 
 
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
 
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN); 
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; 
 
const db = new Database('./crm.db'); 
 
