// Mock database of stolen vehicles
// Format: { plate: "ABC 1234", model: "Toyota Camry", color: "White", status: "Stolen", reportDate: "2023-01-01" }

export const STOLEN_VEHICLES = [
  { plate: "ABC 1234", model: "Toyota Camry", color: "أبيض", status: "مسروقة", reportDate: "2024-03-15", owner: "أحمد محمد" },
  { plate: "KSA 9999", model: "Honda Accord", color: "أسود", status: "مسروقة", reportDate: "2024-02-20", owner: "خالد العتيبي" },
  { plate: "XYZ 5555", model: "Hyundai Sonata", color: "فضي", status: "مطلوبة", reportDate: "2024-01-10", owner: "سارة عبدالله" },
  { plate: "RUH 2030", model: "Ford Explorer", color: "أزرق", status: "مسروقة", reportDate: "2024-03-01", owner: "محمد السالم" },
  { plate: "DXB 1111", model: "Nissan Patrol", color: "أبيض", status: "مطلوبة أمنياً", reportDate: "2024-03-10", owner: "شركة تأجير" },
];

// Helper to check if a plate is stolen
export const checkPlateStatus = (plateNumber) => {
  const vehicle = STOLEN_VEHICLES.find(v => v.plate === plateNumber);
  return vehicle || null;
};

// Helper to generate a random plate for simulation
export const generateRandomPlate = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  
  // 10% chance to generate a stolen plate from our list
  if (Math.random() < 0.1) {
    const stolen = STOLEN_VEHICLES[Math.floor(Math.random() * STOLEN_VEHICLES.length)];
    return stolen.plate;
  }

  // Generate random plate: 3 letters + 4 numbers
  let plate = "";
  for (let i = 0; i < 3; i++) plate += chars.charAt(Math.floor(Math.random() * chars.length));
  plate += " ";
  for (let i = 0; i < 4; i++) plate += nums.charAt(Math.floor(Math.random() * nums.length));
  
  return plate;
};
