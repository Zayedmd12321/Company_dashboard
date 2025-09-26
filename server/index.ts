import express from "express";
import cors from "cors";
import * as XLSX from "xlsx";
import { Server } from "socket.io";
import http from "http"

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.FRONTEND_URL;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

let activeSocket = null;
io.on('connection', (socket) => {
  console.log('✅ A user connected');
  activeSocket = socket;
  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
    activeSocket = null;
  });
});

app.use(cors({ origin: allowedOrigin }));


// --- Load Excel file once at startup ---
const workbook = XLSX.readFile("data.xls");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

// --- Endpoint: Companies ---
app.get("/api/companies", (req, res) => {
  const companies = Array.from(
    new Set(jsonData.map((row) => row["Company name"]))
  ).filter(Boolean);
  res.json(companies);
});

// --- Endpoint: Data for selected company + multiple metrics ---
app.get("/api/data", (req, res) => {
  const { company, metric } = req.query;

  if (!company || !metric) {
    return res
      .status(400)
      .json({ error: "Missing parameters: company or metric" });
  }

  const metrics = Array.isArray(metric)
    ? (metric as string[])
    : [metric as string];

  const records = jsonData.filter(
    (row) => row["Company name"] === company && metrics.includes(row["Field"])
  );

  if (records.length === 0) {
    return res.json([]);
  }

  const dataByYear: { [year: string]: any } = {};

  records.forEach((record) => {
    const metricName = record["Field"];
    Object.entries(record).forEach(([key, value]) => {
      if (/^\d{4}(\.0)?$/.test(key)) {
        const year = key.replace(".0", "");
        if (!dataByYear[year]) {
          dataByYear[year] = { year };
        }
        dataByYear[year][metricName] = Number(value) || 0;
      }
    });
  });

  const chartData = Object.values(dataByYear).sort(
    (a, b) => Number(a.year) - Number(b.year)
  );

  res.json(chartData);
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});