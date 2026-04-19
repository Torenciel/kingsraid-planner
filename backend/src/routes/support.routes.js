const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailer');

const sanitize = (str) => String(str || '').trim().slice(0, 2000);

// POST /api/v2/support/feedback
router.post('/feedback', async (req, res) => {
  const { name, email, category, message } = req.body;

  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Message must be at least 10 characters.' });
  }

  try {
    await sendEmail({
      to: 'feedback@kingsraid-planner.com',
      subject: `[Feedback] ${sanitize(category) || 'General'}`,
      html: `
        <h2>New Feedback</h2>
        <p><strong>Category:</strong> ${sanitize(category) || 'General'}</p>
        <p><strong>Name:</strong> ${sanitize(name) || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${sanitize(email) || 'Not provided'}</p>
        <hr/>
        <p>${sanitize(message).replace(/\n/g, '<br/>')}</p>
      `
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback email error:', err);
    res.status(500).json({ success: false, error: 'Failed to send feedback.' });
  }
});

// POST /api/v2/support/bug-report
router.post('/bug-report', async (req, res) => {
  const { name, email, title, description, steps, device } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Title is required.' });
  }
  if (!description || description.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Description must be at least 10 characters.' });
  }

  try {
    await sendEmail({
      to: 'bugs@kingsraid-planner.com',
      subject: `[Bug] ${sanitize(title)}`,
      html: `
        <h2>Bug Report</h2>
        <p><strong>Title:</strong> ${sanitize(title)}</p>
        <p><strong>Name:</strong> ${sanitize(name) || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${sanitize(email) || 'Not provided'}</p>
        <p><strong>Device / Browser:</strong> ${sanitize(device) || 'Not provided'}</p>
        <hr/>
        <p><strong>Description:</strong></p>
        <p>${sanitize(description).replace(/\n/g, '<br/>')}</p>
        ${steps ? `<p><strong>Steps to reproduce:</strong></p><p>${sanitize(steps).replace(/\n/g, '<br/>')}</p>` : ''}
      `
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Bug report email error:', err);
    res.status(500).json({ success: false, error: 'Failed to send bug report.' });
  }
});

module.exports = router;
