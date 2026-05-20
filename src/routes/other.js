const express = require('express');
const path = require('path');
const router = express.Router();

router.all('*', (req, res) => {
  if (req.path !== '/') {
    return res.redirect('/');
  }
  // Fallback
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'), { maxAge: '1d' });
});

module.exports = router;