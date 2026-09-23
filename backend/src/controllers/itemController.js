const Item = require('../models/Item');
const matchController = require('./matchController');

/**
 * Report a new Lost or Found item
 */
exports.reportItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      location,
      dateOccurred,
      imageUrl,
      tags,
      contactEmail,
      contactPhone,
      reportedBy,
    } = req.body;

    if (!title || !description || !type || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, type (LOST/FOUND), and location are required',
      });
    }

    const item = await Item.create({
      title,
      description,
      category: category || 'Other',
      type: type.toUpperCase(),
      location,
      dateOccurred: dateOccurred || Date.now(),
      imageUrl: imageUrl || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      contactEmail,
      contactPhone,
      reportedBy: reportedBy || req.user?.id || '000000000000000000000000',
      status: 'OPEN',
    });

    // Asynchronously trigger AI match evaluation against opposite type items
    matchController.evaluateItemMatches(item._id).catch((err) => {
      console.warn('[ItemController] Background AI match evaluation failed:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: `${item.type} item reported successfully`,
      item,
    });
  } catch (error) {
    console.error('Error reporting item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieve items with optional search & filters
 */
exports.getItems = async (req, res) => {
  try {
    const { type, category, status, search, limit = 20, page = 1 } = req.query;
    const filter = {};

    if (type) filter.type = type.toUpperCase();
    if (category && category !== 'All') filter.category = category;
    if (status) filter.status = status.toUpperCase();

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const items = await Item.find(filter)
      .populate('reportedBy', 'name email campusId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Item.countDocuments(filter);

    return res.json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get item by ID
 */
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email campusId phoneNumber')
      .populate('matchedItem', 'title category imageUrl location');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update item status (e.g., OPEN -> RESOLVED / MATCHED)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status, matchedItemId } = req.body;
    const updateData = { status };

    if (matchedItemId) {
      updateData.matchedItem = matchedItemId;
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
