const express = require('express');
const User = require('../models/bannerModal');
const router = express.Router();
const upload = require('../middlewares/upload'); 

router.post('/banners', upload.single('photo'), async (req, res) => {
  try {
    const { section, page, link, connection, background_color } = req.body;

    if (!section) {
      return res.status(400).json({ error: 'Section is required' });
    }

      if (section === 'top') {
        const existingTop = await User.findOne({ section: 'top', page });
      
        if (existingTop) {
          return res.status(400).json({ error: `Only one top banner is allowed on the ${page} page` });
        }
      
      
      if (!background_color) {
        return res.status(400).json({ error: 'Background color is required for top section' });
      }
    }

    const photo = req.file ? req.file.path : null;

    const newBanner = new User({
      section,
      page,
      link,
      connection,
      background_color,
      photo,
      ...(section === 'top' && { background_color }) 
    });

    await newBanner.save();
    res.status(201).json({ message: 'Banner created successfully', banner: newBanner });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/banners', async (req, res) => {
  try {
    const { section, page } = req.query;

    const query = {};
    if (section) query.section = section;
    if (page) query.page = page;

    const banners = await User.find(query);
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/banner/:banner_id', async (req, res) => {
  try {
    const { banner_id } = req.params;
    const banner = await User.findOne({ banner_id });

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/banners/:banner_id', async (req, res) => {
  try {
    const { banner_id } = req.params;
    const banner = await User.findOneAndDelete({ banner_id });

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/banners/:banner_id', upload.single('photo'), async (req, res) => {
  try {
    const { banner_id } = req.params;
    const { link, connection, background_color, section, page } = req.body;

    // ❌ Block changes to section or page
    if (section || page) {
      return res.status(400).json({ error: 'Editing section or page is not allowed' });
    }

    const banner = await User.findOne({ banner_id });
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // ✅ Update only allowed fields
    banner.link = link !== undefined ? link : banner.link;
    banner.connection = connection !== undefined ? connection : banner.connection;
    banner.background_color = background_color !== undefined ? background_color : banner.background_color;

    if (req.file) {
      banner.photo = req.file.path;
    }

    await banner.save();

    res.status(200).json({ message: 'Banner updated successfully', banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
