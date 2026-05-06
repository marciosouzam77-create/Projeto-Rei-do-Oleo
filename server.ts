import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    users: [], // Admins
    customers: [
      { id: "1", name: "João Silva", phone: "41999999999", email: "joao@example.com", createdAt: new Date().toISOString() }
    ],
    vehicles: [
      { 
        id: "1", 
        customerId: "1", 
        plate: "ABC1D23", 
        brand: "Volkswagen", 
        model: "Golf", 
        currentKm: 50000, 
        lastOilChangeKm: 45000, 
        nextChangeKm: 55000, 
        nextChangeDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        passwordHash: bcrypt.hashSync("ABC1D23", 10),
        mustChangePassword: true
      }
    ],
    services: [
      { id: "1", vehicleId: "1", date: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(), oilType: "Sintético", viscosity: "5W30", currentKm: 45000, nextChangeKm: 55000, nextChangeDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(), totalPrice: 350 }
    ],
    settings: {
      adminPasswordHash: bcrypt.hashSync("admin123", 10), // Default admin password
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

function getData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { type, plate, password } = req.body;
    const data = getData();

    if (type === "admin") {
      if (bcrypt.compareSync(password, data.settings.adminPasswordHash)) {
        return res.json({ token: "admin-token", user: { role: "admin", name: "Administrador" } });
      }
      return res.status(401).json({ error: "Senha de administrador incorreta" });
    } else {
      // Customer login by Plate
      const vehicle = data.vehicles.find((v: any) => v.plate.toUpperCase() === plate.toUpperCase());
      if (vehicle) {
        const customer = data.customers.find((c: any) => c.id === vehicle.customerId);
        
        // If no passwordHash (old data), check plate or phone as fallback, then set it
        if (!vehicle.passwordHash) {
          if (password === vehicle.plate || password === customer.phone) {
            return res.json({ 
              token: "customer-token", 
              user: { 
                role: "customer", 
                plate, 
                customerId: customer.id,
                mustChangePassword: true 
              } 
            });
          }
        } else if (bcrypt.compareSync(password, vehicle.passwordHash)) {
          return res.json({ 
            token: "customer-token", 
            user: { 
              role: "customer", 
              plate, 
              customerId: customer.id,
              mustChangePassword: vehicle.mustChangePassword 
            } 
          });
        }
      }
      return res.status(401).json({ error: "Placa ou senha inválida" });
    }
  });

  // Password Change
  app.post("/api/auth/change-password", (req, res) => {
    const { plate, newPassword } = req.body;
    const data = getData();
    const vehicleIndex = data.vehicles.findIndex((v: any) => v.plate.toUpperCase() === plate.toUpperCase());
    
    if (vehicleIndex !== -1) {
      data.vehicles[vehicleIndex].passwordHash = bcrypt.hashSync(newPassword, 10);
      data.vehicles[vehicleIndex].mustChangePassword = false;
      saveData(data);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Veículo não encontrado" });
  });

  // Customers Edits
  app.put("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    const index = data.customers.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      data.customers[index] = { ...data.customers[index], ...req.body };
      saveData(data);
      res.json(data.customers[index]);
    } else {
      res.status(404).json({ error: "Cliente não encontrado" });
    }
  });

  // Vehicles Edits
  app.put("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    const index = data.vehicles.findIndex((v: any) => v.id === id);
    if (index !== -1) {
      const update = { ...req.body };
      if (update.password) {
        update.passwordHash = bcrypt.hashSync(update.password, 10);
        delete update.password;
      }
      data.vehicles[index] = { ...data.vehicles[index], ...update };
      saveData(data);
      res.json(data.vehicles[index]);
    } else {
      res.status(404).json({ error: "Veículo não encontrado" });
    }
  });

  // Services Edits
  app.put("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    const index = data.services.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      const oldService = data.services[index];
      const updatedService = { ...oldService, ...req.body };
      data.services[index] = updatedService;
      
      // If this is the most recent service, update the vehicle stats
      const vehicleServices = data.services.filter((s: any) => s.vehicleId === updatedService.vehicleId)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (vehicleServices[0].id === updatedService.id) {
        const vehicleIndex = data.vehicles.findIndex((v: any) => v.id === updatedService.vehicleId);
        if (vehicleIndex !== -1) {
          data.vehicles[vehicleIndex].currentKm = updatedService.currentKm;
          data.vehicles[vehicleIndex].lastOilChangeKm = updatedService.currentKm;
          data.vehicles[vehicleIndex].lastOilChangeDate = updatedService.date;
          data.vehicles[vehicleIndex].nextChangeKm = updatedService.nextChangeKm;
          data.vehicles[vehicleIndex].nextChangeDate = updatedService.nextChangeDate;
        }
      }
      
      saveData(data);
      res.json(updatedService);
    } else {
      res.status(404).json({ error: "Serviço não encontrado" });
    }
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    res.json(getData().customers);
  });

  app.post("/api/customers", (req, res) => {
    const data = getData();
    const newCustomer = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString() };
    data.customers.push(newCustomer);
    saveData(data);
    res.json(newCustomer);
  });

  // Vehicles
  app.get("/api/vehicles", (req, res) => {
    res.json(getData().vehicles);
  });

  app.post("/api/vehicles", (req, res) => {
    const data = getData();
    const { plate, mustChangePassword, password } = req.body;
    
    const newVehicle = { 
      ...req.body, 
      id: uuidv4(), 
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync(password || plate, 10),
      mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : true
    };
    
    // Remove plain password before saving if present
    delete newVehicle.password;
    
    data.vehicles.push(newVehicle);
    saveData(data);
    res.json(newVehicle);
  });

  // Services
  app.get("/api/services", (req, res) => {
    const { plate } = req.query;
    const data = getData();
    if (plate) {
      const vehicle = data.vehicles.find((v: any) => v.plate.toUpperCase() === (plate as string).toUpperCase());
      if (!vehicle) return res.json([]);
      return res.json(data.services.filter((s: any) => s.vehicleId === vehicle.id));
    }
    res.json(data.services);
  });

  app.post("/api/services", (req, res) => {
    const data = getData();
    const newService = { ...req.body, id: uuidv4(), date: new Date().toISOString() };
    data.services.push(newService);
    
    // Update vehicle KM
    const vehicleIndex = data.vehicles.findIndex((v: any) => v.id === newService.vehicleId);
    if (vehicleIndex !== -1) {
      data.vehicles[vehicleIndex].currentKm = newService.currentKm;
      data.vehicles[vehicleIndex].lastOilChangeKm = newService.currentKm;
      data.vehicles[vehicleIndex].lastOilChangeDate = newService.date;
      data.vehicles[vehicleIndex].nextChangeKm = newService.nextChangeKm;
      data.vehicles[vehicleIndex].nextChangeDate = newService.nextChangeDate;
    }
    
    saveData(data);
    res.json(newService);
  });

  app.delete("/api/services/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    data.services = data.services.filter((s: any) => s.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  app.delete("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    data.customers = data.customers.filter((c: any) => c.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  app.delete("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    data.vehicles = data.vehicles.filter((v: any) => v.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  // Reminders (Automatic notification logic)
  app.get("/api/reminders", (req, res) => {
    const data = getData();
    const today = new Date();
    const result = data.vehicles.map((v: any) => {
      const customer = data.customers.find((c: any) => c.id === v.customerId);
      const nextDate = new Date(v.nextChangeDate);
      const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const kmRemaining = v.nextChangeKm ? v.nextChangeKm - v.currentKm : 999999;
      
      const needsDateAttention = daysLeft <= 7;
      const needsKmAttention = kmRemaining <= 500;
      
      let reason = "";
      if (needsDateAttention) reason = "Prazo de validade próximo";
      if (needsKmAttention) reason = "Quilometragem próxima";
      if (needsDateAttention && needsKmAttention) reason = "Prazo e KM próximos";

      return {
        ...v,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        daysLeft,
        kmRemaining,
        reason,
        needsAttention: needsDateAttention || needsKmAttention
      };
    }).filter((v: any) => v.needsAttention);
    
    res.json(result);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (r, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
