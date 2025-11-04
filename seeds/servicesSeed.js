require("dotenv").config(); // Added to load environment variables
const mongoose = require("mongoose");
const Service = require("../models/Service"); // Adjust path if needed
const SubService = require("../models/SubService"); // Adjust path if needed

// Using environment variables for the connection string
const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vzoxgr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// The data from your services.json file
const servicesData = [
  {
    "name": "Home Maintenance",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762123935/sa3tha%20services%20images/1762123929580-Picsart_25-11-03_00-50-54-652.png.png",
    "description": "Services to keep your home in top condition, from pipes to wires.",
    "subservices": [
      {
        "name": "Plumbing",
        "description": "Fixing leaks, unclogging drains, and installing pipes."
      },
      {
        "name": "Electrical Work",
        "description": "Installing fixtures, fixing wiring, and ensuring safety."
      },
      {
        "name": "Carpentry",
        "description": "Building, repairing, and installing wooden fixtures and furniture."
      },
      {
        "name": "Painting",
        "description": "Interior and exterior painting services for a fresh look."
      },
      {
        "name": "Tiling",
        "description": "Installing and repairing floor and wall tiles."
      },
      {
        "name": "Locksmith",
        "description": "Installing, repairing, and opening locks."
      }
    ]
  },
  {
    "name": "Appliance Repair",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762123048/sa3tha%20services%20images/1762123043594-Picsart_25-11-02_22-44-28-938.png.png",
    "description": "Get your essential home appliances fixed by professionals.",
    "subservices": [
      {
        "name": "AC Repair",
        "description": "Servicing and repairing all types of air conditioners."
      },
      {
        "name": "Refrigerator Repair",
        "description": "Fixing cooling issues, leaks, and broken refrigerator parts."
      },
      {
        "name": "Washing Machine Repair",
        "description": "Repairing washers that don't spin, drain, or turn on."
      },
      {
        "name": "TV Repair",
        "description": "Fixing screen issues, sound problems, and power failures."
      },
      {
        "name": "Microwave Repair",
        "description": "Repairing microwaves that don't heat or turn on."
      }
    ]
  },
  {
    "name": "Cleaning Services",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762124089/sa3tha%20services%20images/1762124081759-Picsart_25-11-02_22-39-44-198.png.png",
    "description": "Professional cleaning for homes, offices, and more.",
    "subservices": [
      {
        "name": "House Cleaning",
        "description": "General cleaning for your home, including dusting and mopping."
      },
      {
        "name": "Deep Cleaning",
        "description": "A thorough, top-to-bottom cleaning service for all rooms."
      },
      {
        "name": "Office Cleaning",
        "description": "Keeping your workspace clean, hygienic, and professional."
      },
      {
        "name": "Carpet Cleaning",
        "description": "Deep cleaning and stain removal for carpets and rugs."
      },
      {
        "name": "Window Cleaning",
        "description": "Streak-free cleaning for interior and exterior windows."
      }
    ]
  },
  {
    "name": "Construction",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762124154/sa3tha%20services%20images/1762124148474-Picsart_25-11-02_22-48-23-489.png.png",
    "description": "Building, renovating, and structural work from the ground up.",
    "subservices": [
      {
        "name": "General Construction",
        "description": "Managing and executing all phases of a building project."
      },
      {
        "name": "Renovation",
        "description": "Updating and remodeling existing structures."
      },
      {
        "name": "Plastering",
        "description": "Applying plaster to walls and ceilings for a smooth finish."
      },
      {
        "name": "Masonry",
        "description": "Working with brick, stone, and concrete for structures."
      },
      {
        "name": "Roofing",
        "description": "Installing, repairing, and maintaining roofs."
      }
    ]
  },
  {
    "name": "Garden & Outdoor",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762124240/sa3tha%20services%20images/1762124235013-Picsart_25-11-02_22-46-14-676.png.png",
    "description": "Services to make your outdoor space beautiful and healthy.",
    "subservices": [
      {
        "name": "Gardening",
        "description": "Planting, weeding, and general garden maintenance."
      },
      {
        "name": "Landscaping",
        "description": "Designing and creating beautiful outdoor spaces."
      },
      {
        "name": "Tree Trimming",
        "description": "Safely pruning and trimming trees for health and aesthetics."
      },
      {
        "name": "Lawn Care",
        "description": "Mowing, fertilizing, and maintaining a healthy lawn."
      }
    ]
  },
  {
    "name": "Tech Services",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762124294/sa3tha%20services%20images/1762124289097-Picsart_25-11-02_22-45-19-194.png.png",
    "description": "Installation and repair for your technology needs.",
    "subservices": [
      {
        "name": "Computer Repair",
        "description": "Diagnosing and fixing hardware and software issues."
      },
      {
        "name": "Network Setup",
        "description": "Installing and configuring home or office Wi-Fi networks."
      },
      {
        "name": "Smart Home Installation",
        "description": "Setting up smart lights, speakers, and security systems."
      },
      {
        "name": "CCTV Installation",
        "description": "Installing security cameras for home or business surveillance."
      }
    ]
  },
  {
    "name": "Moving & Transport",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762124385/sa3tha%20services%20images/1762124380933-Picsart_25-11-02_22-43-35-135.png.png",
    "description": "Helping you move your belongings safely and efficiently.",
    "subservices": [
      {
        "name": "Furniture Moving",
        "description": "Safely moving heavy furniture and items."
      },
      {
        "name": "Packing Services",
        "description": "Securely packing your belongings for a move."
      },
      {
        "name": "Storage",
        "description": "Providing short-term or long-term storage solutions."
      }
    ]
  },
  {
    "name": "Other Services",
    "icon": "https://res.cloudinary.com/dpmsou908/image/upload/v1762125181/sa3tha%20services%20images/1762125174791-Gemini_Generated_Image_fvntx1fvntx1fvnt.png.png",
    "description": "A variety of specialized services for your home or business.",
    "subservices": [
      {
        "name": "Pest Control",
        "description": "Exterminating and preventing pests like insects and rodents."
      },
      {
        "name": "Water Tank Cleaning",
        "description": "Hygienic cleaning and disinfection of water storage tanks."
      },
      {
        "name": "Satellite Installation",
        "description": "Setting up and aligning satellite dishes for TV."
      },
      {
        "name": "Interior Design",
        "description": "Planning and designing the interior spaces of your home."
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    await mongoose.connect(DB_URI);
    console.log("Database connected.");

    console.log("Clearing old data...");
    // Clear subservices first because they reference services
    await SubService.deleteMany({});
    await Service.deleteMany({});
    console.log("Old data cleared.");

    console.log("Starting to seed data...");

    // Iterate over each service category
    for (const serviceData of servicesData) {
      // Create and save the main service
      const service = new Service({
        name: serviceData.name,
        icon: serviceData.icon,
        description: serviceData.description,
      });
      await service.save();

      // Prepare subservices with the new service's ID
      const subServicesToCreate = serviceData.subservices.map((sub) => ({
        name: sub.name,
        description: sub.description,
        service: service._id, // Link to the parent service
      }));

      // Insert all subservices for this service
      if (subServicesToCreate.length > 0) {
        await SubService.insertMany(subServicesToCreate);
      }

      console.log(
        `Seeded service: ${service.name} with ${subServicesToCreate.length} subservices.`
      );
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    console.log("Closing database connection...");
    await mongoose.connection.close();
  }
};

// Run the seeder
seedDatabase();

