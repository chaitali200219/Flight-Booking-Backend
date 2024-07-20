const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser=require('cookie-parser')
const bcrypt = require('bcryptjs');
const jwt=require("jsonwebtoken")
const jwtSecretKey = 'your_jwt_secret_key';



function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}




const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from your Angular app
app.use(cors({
  origin: 'http://localhost:4200', // Adjust to match your Angular app's URL
  credentials: true // Allow cookies and other credentials to be sent
}));

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies

const usersFilePath = path.join(__dirname, 'users.json');


const vendorsFilePath = path.join(__dirname, 'vendors.json');

// Endpoint for vendor registration
app.post('/api/vendorRegister', async (req, res) => {
  const { organizationName, organizationId, vendorName, email, contactNumber, password } = req.body;

  // Validate the input
  if (!organizationName || !organizationId || !vendorName || !email || !contactNumber || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Read existing vendors from file
    const vendorsData = fs.existsSync(vendorsFilePath)
      ? JSON.parse(fs.readFileSync(vendorsFilePath, 'utf8'))
      : [];

    // Check if vendor already exists
    const existingVendor = vendorsData.find(vendor => vendor.email === email || vendor.organizationId === organizationId);
    if (existingVendor) {
      return res.status(409).json({ error: 'Vendor already registered with this email or organization ID.' });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the new vendor to the list
    const newVendor = { organizationName, organizationId, vendorName, email, contactNumber, password: hashedPassword };
    vendorsData.push(newVendor);

    // Write updated vendors to file
    fs.writeFileSync(vendorsFilePath, JSON.stringify(vendorsData, null, 2));

    res.status(201).json({ message: 'Vendor registered successfully.' });
  } catch (err) {
    console.error('Error registering vendor:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/vendorLogin', (req, res) => {
  const { username, password } = req.body;
  
  // Read existing vendors from file
  const vendorsData = fs.existsSync(vendorsFilePath)
    ? JSON.parse(fs.readFileSync(vendorsFilePath, 'utf8'))
    : [];
    
  // Find the vendor by username
  const vendor = vendorsData.find(v => v.email === username);
  
  if (!vendor) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Compare the provided password with the stored hashed password
  bcrypt.compare(password, vendor.password, (err, isMatch) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate a JWT token
    const token = jwt.sign({ email: vendor.email, role: 'vendor' }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  });
});







app.get('/api/cities', (req, res) => {
  const filePath = path.join(__dirname, 'cities.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});
app.post('/api/cities', (req, res) => {
  const filePath = path.join(__dirname, 'cities.json');
  const newCity = req.body; // Get the new city data from request body

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      jsonData.data.push(newCity); // Add the new city data

      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Error writing JSON file:', writeErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(201).json({ message: 'City added successfully', data: jsonData });
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});
// Endpoint to add a new airport
app.post('/api/flights', (req, res) => {
  const filePath = path.join(__dirname, 'getAllFlights.json');
  const newFlights = req.body; // Get the new airport data from request body

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      jsonData.data.push(newFlights); // Add the new airport data

      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Error writing JSON file:', writeErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(201).json({ message: 'Airport added successfully', data: newFlights });
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});




app.get('/api/allflights', (req, res) => {
  const filePath = path.join(__dirname, 'getAllFlights.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});



app.get('/api/airport', (req, res) => {
  const filePath = path.join(__dirname, 'airport.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});
app.post('/api/airport', (req, res) => {
  const filePath = path.join(__dirname, 'airports.json');
  const newAirport = req.body; // Get the new airport data from request body

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const jsonData = JSON.parse(data);
      jsonData.data.push(newAirport); // Add the new airport data

      fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Error writing JSON file:', writeErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(201).json({ message: 'Airport added successfully', data: jsonData });
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});

app.delete('/api/flights/:flightNumber', (req, res) => {
  const filePath = path.join(__dirname, 'getAllFlights.json');
  const flightNumber = req.params.flightNumber;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading flights file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const flights = JSON.parse(data).data;
      const flightIndex = flights.findIndex(flight => flight.flightNumber === flightNumber);

      if (flightIndex !== -1) {
        flights.splice(flightIndex, 1);

        fs.writeFile(filePath, JSON.stringify({ data: flights }, null, 2), (writeErr) => {
          if (writeErr) {
            console.error('Error writing to flights file:', writeErr);
            return res.status(500).json({ message: 'Internal server error' });
          }

          res.status(200).json({ message: 'Flight deleted successfully' });
        });
      } else {
        res.status(404).json({ message: 'Flight not found' });
      }
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});

app.post('/api/flights/del', (req, res) => {
  res.send("done")
  const filePath = path.join(__dirname, 'getAllFlights.json');
  const flightNumber = req.body.flightNumber; // assuming the flightNumber is sent in the request body

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading flights file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      const flights = JSON.parse(data).data;
      const flightIndex = flights.findIndex(flight => flight.flightNumber === flightNumber);

      if (flightIndex !== -1) {
        flights.splice(flightIndex, 1);

        fs.writeFile(filePath, JSON.stringify({ data: flights }, null, 2), (writeErr) => {
          if (writeErr) {
            console.error('Error writing to flights file:', writeErr);
            return res.status(500).json({ message: 'Internal server error' });
          }

          res.status(200).json({ message: 'Flight deleted successfully' });
        });
      } else {
        res.status(404).json({ message: 'Flight not found' });
      }
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res.status(500).json({ message: 'Error parsing JSON' });
    }
  });
});


app.get('/api/search-flight', (req, res) => {
  const filePath = path.join(__dirname, 'SearchFlight.json');
  
  console.log('Requested /api/search-flight');
  console.log('File Path:', filePath); // Log file path for debugging

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', err);
      return res.status(404).json({ message: 'File not found' });
    }

    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).json({ message: 'Error parsing JSON' });
      }
    });
  });
});

app.post('/api/search-flight', (req, res) => {
  const filePath = path.join(__dirname, 'SearchFlight.json');

  console.log('Requested /api/search-flight (POST)');
  console.log('File Path:', filePath); // Log file path for debugging

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', err);
      return res.status(404).json({ message: 'File not found' });
    }

    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      try {
        let jsonData = JSON.parse(data);

        // Check if jsonData is an array, if not, convert it to an array
        if (!Array.isArray(jsonData)) {
          jsonData = [];
        }

        // Add the new flight data to the jsonData
        jsonData.push(req.body);

        // Write the updated data back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
          if (err) {
            console.error('Error writing JSON file:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }
          res.status(200).json({ message: 'Flight data saved successfully', data: jsonData });
        });
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).json({ message: 'Error parsing JSON' });
      }
    });
  });
});


// app.post('/api/register', (req, res) => {
//   const filePath = path.join(__dirname, 'register.json');
//   const newUser = req.body; // Get the new user data from request body

//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading JSON file:', err);
//       return res.status(500).json({ message: 'Internal server error' });
//     }

//     try {
//       const users = JSON.parse(data);
//       users.data.push(newUser); // Add the new user data

//       fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
//         if (writeErr) {
//           console.error('Error writing JSON file:', writeErr);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         res.status(201).json({ message: 'User registered successfully', data: newUser });
//       });
//     } catch (parseErr) {
//       console.error('Error parsing JSON:', parseErr);
//       res.status(500).json({ message: 'Error parsing JSON' });
//     }
//   });
// });
const filePath = path.join(__dirname, 'register.json');

app.post('/api/register', (req, res) => {
  const newUser = req.body; // Get the new user data from request body

  // Validate the request body
  if (!newUser.username || !newUser.email || !newUser.password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  // Generate a salt and hash the password
  bcrypt.genSalt(10, (saltErr, salt) => {
    if (saltErr) {
      console.error('Error generating salt:', saltErr);
      return res.status(500).json({ message: 'Internal server error' });
    }

    bcrypt.hash(newUser.password, salt, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Error hashing password:', hashErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Replace plain password with hashed password
      newUser.password = hashedPassword;

      // Read existing users from file
      fs.readFile(filePath, 'utf8', (readErr, data) => {
        if (readErr) {
          console.error('Error reading JSON file:', readErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          const users = JSON.parse(data);
          users.data.push(newUser); // Add the new user data

          // Write updated users back to file
          fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
              console.error('Error writing JSON file:', writeErr);
              return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(201).json({ message: 'User registered successfully', data: newUser });
          });
        } catch (parseErr) {
          console.error('Error parsing JSON:', parseErr);
          res.status(500).json({ message: 'Error parsing JSON' });
        }
      });
    });
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // First check in users.json
    let users = JSON.parse(fs.readFileSync(filePath, 'utf8')).data;
    let user = users.find(u => u.username === username);

    // If not found, check in vendors.json
    if (!user) {
      const vendorsData = fs.existsSync(vendorsFilePath) ? JSON.parse(fs.readFileSync(vendorsFilePath, 'utf8')) : [];
      user = vendorsData.find(v => v.email === username); // Assume email is used as username for vendors
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username, role: user.role || 'user' }, 'your_jwt_secret_key', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// app.post('/api/login', (req, res) => {
//   const { username, password } = req.body;

//   // Validate the request body
//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required' });
//   }

//   // Read existing users from file
//   fs.readFile(filePath, 'utf8', (readErr, data) => {
//     if (readErr) {
//       console.error('Error reading JSON file:', readErr);
//       return res.status(500).json({ message: 'Internal server error' });
//     }

//     try {
//       const users = JSON.parse(data);
//       const user = users.data.find(u => u.username === username);

//       if (!user) {
//         return res.status(401).json({ message: 'Invalid username or password' });
//       }

//       // Compare password with hashed password
//       bcrypt.compare(password, user.password, (compareErr, isMatch) => {
//         if (compareErr) {
//           console.error('Error comparing passwords:', compareErr);
//           return res.status(500).json({ message: 'Internal server error' });
//         }

//         if (!isMatch) {
//           return res.status(401).json({ message: 'Invalid username or password' });
//         }

//         // Generate JWT
//         const token = jwt.sign({ username: user.username }, 'your_jwt_secret_key', { expiresIn: '1h' });

//         res.json({ message: 'Login successful', token });
//       });
//     } catch (parseErr) {
//       console.error('Error parsing JSON:', parseErr);
//       res.status(500).json({ message: 'Error parsing JSON' });
//     }
//   });
// });

const DATA_FILE = path.join(__dirname, 'getAllFlights.json');




// Endpoint to search flights based on criteria
app.post('/api/search', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading flights data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON data:', jsonData);

      const { from, to } = req.body;
      console.log('Search parameters:', { from, to });

      const filteredFlights = jsonData.data.filter(item => {
        if (!item || !item.arrivalAirportName || !item.departureAirportName) {
          return false;
        }

        return (
          item.arrivalAirportName.toLowerCase().includes(from.toLowerCase()) &&
          item.departureAirportName.toLowerCase().includes(to.toLowerCase())
        );
      });

      console.log('Filtered flights:', filteredFlights);
      res.json({ flights: filteredFlights });
    } catch (error) {
      console.error('Error parsing JSON or filtering flights:', error);
      res.status(500).json({ error: 'Error processing request' });
    }
  });
});

const userDetailsFilePath = path.join(__dirname, 'userDetails.json');

// Initialize userDetails.json with an empty array if it doesn't exist
if (!fs.existsSync(userDetailsFilePath)) {
  fs.writeFileSync(userDetailsFilePath, JSON.stringify([]));
}

app.post('/api/saveBooking', (req, res) => {
  const newBooking = req.body;

  fs.readFile(userDetailsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    let userDetails = [];

    try {
      userDetails = data? JSON.parse(data):[];
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    userDetails.push(newBooking);

    fs.writeFile(userDetailsFilePath, JSON.stringify(userDetails, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing file:', writeErr);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      res.json({ message: 'Booking saved successfully' });
    });
  });
});

// app.get('/api/getBookings', (req, res) => {
//   fs.readFile(userDetailsFilePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading file:', err);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     let userDetails = [];

//     try {
//       userDetails = data ? JSON.parse(data) : [];
//     } catch (parseErr) {
//       console.error('Error parsing JSON:', parseErr);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     res.json(userDetails);
//   });
// });


app.get('/api/getBookings', authenticateToken, (req, res) => {
  fs.readFile(userDetailsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    let userDetails = [];

    try {
      userDetails = data ? JSON.parse(data) : [];
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Filter bookings for the logged-in user
    const userBookings = userDetails.filter(
      (booking) => booking.name.toLowerCase() === req.user.username.toLowerCase()
    );

    res.json(userBookings);
  });
});








app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
