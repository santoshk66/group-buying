const express = require("express");
const cors = require("cors");
const app = express();

// Allow CORS for your Shopify store domain
app.use(cors({ 
  origin: ['https://grousale.com', 'https://your-shopify-store.myshopify.com'] // Add your Shopify myshopify.com domain as a fallback
}));
app.use(express.json());

let groups = {}; // In-memory storage

// Utility to check if group is expired
const isGroupExpired = (group) => {
  return Date.now() > group.expiresAt;
};

app.post("/createGroup", (req, res) => {
  console.log('Received /createGroup request:', req.body); // Debug log
  const { productId, variantId, groupSize, discountPercentage, groupDuration } = req.body;
  
  // Input validation
  if (!productId || !variantId || !groupSize || !discountPercentage || !groupDuration) {
    console.error('Missing required fields:', req.body);
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (isNaN(groupSize) || isNaN(discountPercentage) || isNaN(groupDuration)) {
    console.error('Invalid numeric values:', req.body);
    return res.status(400).json({ error: "Invalid numeric values" });
  }
  if (groupSize < 2 || groupSize > 10 || discountPercentage < 5 || discountPercentage > 50 || groupDuration < 6 || groupDuration > 72) {
    console.error('Invalid field values:', req.body);
    return res.status(400).json({ error: "Invalid field values" });
  }

  const groupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  groups[groupId] = {
    id: groupId,
    productId,
    variantId,
    groupSize: parseInt(groupSize),
    discountPercentage: parseInt(discountPercentage),
    members: [],
    status: "active",
    createdAt: Date.now(),
    expiresAt: Date.now() + parseInt(groupDuration) * 3600000
  };
  console.log('Group created:', groups[groupId]);
  res.json({ groupId, status: "active", expiresAt: groups[groupId].expiresAt });
});

app.get("/getGroup", (req, res) => {
  const { id } = req.query;
  console.log('Received /getGroup request for ID:', id);
  if (!id) return res.status(400).json({ error: "Group ID is required" });
  if (!groups[id]) return res.status(404).json({ error: "Group not found" });
  
  if (isGroupExpired(groups[id])) {
    groups[id].status = "expired";
    return res.status(410).json({ error: "Group expired" });
  }
  
  res.json(groups[id]);
});

app.post("/joinGroup", (req, res) => {
  const { id } = req.query;
  const { userId } = req.body;
  console.log('Received /joinGroup request:', { id, userId });

  if (!id) return res.status(400).json({ error: "Group ID is required" });
  if (!userId) return res.status(400).json({ error: "User ID is required" });
  if (!groups[id]) return res.status(404).json({ error: "Group not found" });
  
  if (isGroupExpired(groups[id])) {
    groups[id].status = "expired";
    return res.status(410).json({ error: "Group expired" });
  }

  if (groups[id].status === "full") {
    return res.status(400).json({ error: "Group is already full" });
  }

  if (groups[id].members.includes(userId)) {
    return res.json({ message: "Already joined", status: groups[id].status, members: groups[id].members });
  }

  groups[id].members.push(userId);
  if (groups[id].members.length >= groups[id].groupSize) {
    groups[id].status = "full";
  }

  res.json({ status: groups[id].status, members: groups[id].members });
});

app.post("/applyDiscount", (req, res) => {
  const { id } = req.query;
  console.log('Received /applyDiscount request for ID:', id);
  if (!id) return res.status(400).json({ error: "Group ID is required" });
  if (!groups[id]) return res.status(404).json({ error: "Group not found" });
  
  if (groups[id].status !== "full") {
    return res.status(400).json({ error: "Group is not full" });
  }
  
  res.json({ groupId: id, status: "full", discountPercentage: groups[id].discountPercentage });
});

app.get("/", (req, res) => {
  res.send("✅ Grousale backend is live!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
