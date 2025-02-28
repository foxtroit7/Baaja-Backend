const Artist = require('../models/artistDetailsModel'); // Adjust the path as needed

exports.updateArtist = async (req, res) => {
  try {
    const { userId } = req.params; // Identify the artist
    const updates = req.body;

    const artist = await Artist.findOne({ userId });
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    let changedFields = {};
    for (let key in updates) {
      if (artist[key] !== updates[key]) { // Only store modified fields
        changedFields[key] = updates[key];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    artist.pendingChanges = changedFields;
    artist.approved = false;

    artist.notifications.push({
      message: `Profile update pending approval.`,
      timestamp: new Date(),
      approved: false,
      changedFields: changedFields
    });

    await artist.save();
    res.json({ message: "Changes submitted for approval.", changedFields });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getPendingChanges = async (req, res) => {
    try {
      const { userId } = req.params;
      const artist = await Artist.findOne({ userId });
      if (!artist) return res.status(404).json({ message: "Artist not found" });
  
      if (!artist.pendingChanges || Object.keys(artist.pendingChanges).length === 0) {
        return res.status(400).json({ message: "No pending changes." });
      }
  
      res.json({ pendingChanges: artist.pendingChanges });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.getNotifications = async (req, res) => {
    try {
      const { userId } = req.params;
      const artist = await Artist.findOne({ userId });
      if (!artist) return res.status(404).json({ message: "Artist not found" });
  
      res.json({ notifications: artist.notifications });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.approveChanges = async (req, res) => {
    try {
      const { userId } = req.params;
      const artist = await Artist.findOne({ userId });
      
      if (!artist) return res.status(404).json({ message: "Artist not found" });
  
      if (!artist.pendingChanges || Object.keys(artist.pendingChanges).length === 0) {
        return res.status(400).json({ message: "No pending changes to approve." });
      }
  
      // Apply changes to artist profile
      Object.assign(artist, artist.pendingChanges);
      const updatedFields = { ...artist.pendingChanges };
  
      // Clear pending changes & mark notifications as approved
      artist.pendingChanges = {};
      artist.approved = true;
      artist.notifications = artist.notifications.map(notif => ({
        ...notif,
        approved: true
      }));
  
      await artist.save();
      res.json({ message: "Changes approved and applied.", updatedFields });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.rejectChanges = async (req, res) => {
    try {
      const { userId } = req.params;
      const artist = await Artist.findOne({ userId });
      if (!artist) return res.status(404).json({ message: "Artist not found" });
  
      if (!artist.pendingChanges || Object.keys(artist.pendingChanges).length === 0) {
        return res.status(400).json({ message: "No pending changes to reject." });
      }
  
      // Clear pending changes
      artist.pendingChanges = {};
      artist.approved = true;
      artist.notifications = artist.notifications.map(notif => ({
        ...notif,
        approved: false,
        message: "Changes were rejected."
      }));
  
      await artist.save();
      res.json({ message: "Changes rejected." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  exports.getAllNotifications = async (req, res) => {
    try {
      // Fetch all artists that have notifications
      const artists = await Artist.find({ notifications: { $exists: true, $ne: [] } })
        .select("userId owner_name notifications")
        .lean();


      if (!artists.length) {
        return res.status(200).json({ message: "No notifications available." });
      }
  
      // Flatten and sort notifications (newest first)
      const allNotifications = artists.flatMap(artist =>
        artist.notifications.map(notification => ({
          userId: artist.userId,
          owner_name: artist.owner_name,
          ...notification
        }))
      ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
      res.json({ notifications: allNotifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
  

  