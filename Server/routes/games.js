import express from 'express';
import Game from '../models/Game.js';

const router = express.Router();

// Get all active games (public)
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    
    let query = Game.find(filter).sort({ order: 1, createdAt: -1 });
    
    if (limit) query = query.limit(parseInt(limit));
    
    const games = await query;
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all games including inactive (admin)
router.get('/admin/all', async (req, res) => {
  try {
    const games = await Game.find().sort({ order: 1, createdAt: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured games
router.get('/featured', async (req, res) => {
  try {
    const games = await Game.find({ isActive: true, featured: true })
      .sort({ order: 1 })
      .limit(5);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get new releases
router.get('/new', async (req, res) => {
  try {
    const games = await Game.find({ isActive: true, isNewRelease: true })
      .sort({ releaseDate: -1 })
      .limit(6);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new game
router.post('/', async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update game
router.put('/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete game
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle game active status
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    game.isActive = !game.isActive;
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder games
router.patch('/reorder', async (req, res) => {
  try {
    const { games } = req.body; // Array of { id, order }
    const updatePromises = games.map(({ id, order }) =>
      Game.findByIdAndUpdate(id, { order })
    );
    await Promise.all(updatePromises);
    res.json({ message: 'Games reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
