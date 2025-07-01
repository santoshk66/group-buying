const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

let groups = {}; // In-memory storage

app.post("/createGroup", (req, res) => {
  const { productId, variantId, groupSize, discountPercentage, groupDuration } = req.body;
  const groupId = `group-${Date.now()}`;
  groups[groupId] = {
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
  res.json(groups[id]);
});

app.post("/joinGroup", (req, res) => {
  const { id } = req.query;
  const { userId } = req.body;

  if (!groups[id]) return res.status(404).send("Group not found");

  if (groups[id].members.includes(userId)) {
    return res.json({ message: "Already joined" });
  }

  groups[id].members.push(userId);
  if (groups[id].members.length >= groups[id].groupSize) {
    groups[id].status = "full";
  }

  res.json({ status: groups[id].status, members: groups[id].members });
});

app.get("/", (req, res) => {
  res.send("✅ Grousale backend is live!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));