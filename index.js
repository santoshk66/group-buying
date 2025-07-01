const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

let groups = {}; // In-memory storage

// Utility to check if group is expired
const isGroupExpired = (group) => {
  return Date.now() > group.expiresAt;
};

app.post("/createGroup", (req, res) => {
  const { productId, variantId, groupSize, discountPercentage, groupDuration } = req.body;
  const groupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  groups[groupId] = {
    id: groupId,
    productId,
    variantId,
    groupSize,
    discountPercentage,
    members: [],
    status: "active",
    createdAt: Date.now(),
    expiresAt: Date.now() + groupDuration * 3600000
  };
  res.json({ groupId, status: "active", expiresAt: groups[groupId].expiresAt });
});

app.get("/getGroup", (req, res) => {
  const { id } = req.query;
  if (!groups[id]) return res.status(404).send("Group not found");
  
  if (isGroupExpired(groups[id])) {
    groups[id].status = "expired";
    return res.status(410).send("Group expired");
  }
  
  res.json(groups[id]);
});

app.post("/joinGroup", (req, res) => {
  const { id } = req.query;
  const { userId } = req.body;

  if (!groups[id]) return res.status(404).send("Group not found");
  
  if (isGroupExpired(groups[id])) {
    groups[id].status = "expired";
    return res.status(410).send("Group expired");
  }

  if (groups[id].status === "full") {
    return res.status(400).send("Group is already full");
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
  if (!groups[id]) return res.status(404).send("Group not found");
  
  if (groups[id].status !== "full") {
    return res.status(400).send("Group is not full");
  }
  
  // In a real implementation, this would integrate with Shopify's API to apply discounts
  // For now, return group details for confirmation
  res.json({ groupId: id, status: "full", discountPercentage: groups[id].discountPercentage });
});

app.get("/", (req, res) => {
  res.send("✅ Grousale backend is live!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
