const Item = require('../models/Item');
const MatchHistory = require('../models/MatchHistory');
const notificationService = require('../services/notificationService');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Controller for AI matching routines & results
 */
class MatchController {
  /**
   * Evaluate matches for a newly reported item against open items of the opposite type
   */
  async evaluateItemMatches(itemId) {
    try {
      const targetItem = await Item.findById(itemId).populate('reportedBy');
      if (!targetItem) return;

      const oppositeType = targetItem.type === 'LOST' ? 'FOUND' : 'LOST';
      const candidates = await Item.find({
        type: oppositeType,
        status: { $in: ['OPEN', 'PENDING_MATCH'] },
      }).populate('reportedBy');

      if (candidates.length === 0) return;

      // Prepare payload for AI microservice
      const payload = {
        target: {
          id: targetItem._id.toString(),
          title: targetItem.title,
          description: targetItem.description,
          category: targetItem.category,
          imageUrl: targetItem.imageUrl,
        },
        candidates: candidates.map((c) => ({
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          category: c.category,
          imageUrl: c.imageUrl,
        })),
      };

      let matchResults = [];

      try {
        // Attempt call to Python AI microservice
        const response = await fetch(`${AI_SERVICE_URL}/match/hybrid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          matchResults = data.matches || [];
        }
      } catch (networkError) {
        console.warn('[MatchController] AI service unreachable, running fallback heuristic matching:', networkError.message);
        // Fallback rule-based matching if Python AI microservice is not yet running
        matchResults = candidates.map((cand) => {
          const sameCategory = cand.category === targetItem.category ? 0.4 : 0.1;
          const textSimilarity = this.heuristicTextSim(targetItem.title + ' ' + targetItem.description, cand.title + ' ' + cand.description);
          const hybridScore = Math.min(1.0, sameCategory + textSimilarity * 0.6);
          return {
            candidateId: cand._id.toString(),
            textSimilarity,
            imageSimilarity: 0.0,
            hybridScore,
          };
        });
      }

      // Persist results & notify if threshold met
      for (const res of matchResults) {
        if (res.hybridScore >= 0.5) {
          const lostId = targetItem.type === 'LOST' ? targetItem._id : res.candidateId;
          const foundId = targetItem.type === 'FOUND' ? targetItem._id : res.candidateId;

          const matchRecord = await MatchHistory.findOneAndUpdate(
            { lostItem: lostId, foundItem: foundId },
            {
              textSimilarity: res.textSimilarity,
              imageSimilarity: res.imageSimilarity,
              hybridScore: res.hybridScore,
              status: 'SUGGESTED',
            },
            { upsert: true, new: true }
          );

          // If score is high (>= 0.70), send notification
          if (res.hybridScore >= 0.70) {
            const lostItem = targetItem.type === 'LOST' ? targetItem : candidates.find((c) => c._id.toString() === lostId);
            const foundItem = targetItem.type === 'FOUND' ? targetItem : candidates.find((c) => c._id.toString() === foundId);

            if (lostItem?.reportedBy) {
              await notificationService.createMatchNotification({
                recipientId: lostItem.reportedBy._id,
                recipientEmail: lostItem.reportedBy.email,
                recipientName: lostItem.reportedBy.name,
                lostItem,
                foundItem,
                score: res.hybridScore,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[MatchController] Error evaluating matches:', error);
    }
  }

  /**
   * Helper fallback text similarity (Jaccard similarity on tokens)
   */
  heuristicTextSim(strA, strB) {
    const tokensA = new Set(strA.toLowerCase().split(/\W+/).filter(Boolean));
    const tokensB = new Set(strB.toLowerCase().split(/\W+/).filter(Boolean));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);
    return intersection.size / union.size;
  }

  /**
   * Fetch match candidates for a specific item
   */
  async getItemMatches(req, res) {
    try {
      const { itemId } = req.params;
      const matches = await MatchHistory.find({
        $or: [{ lostItem: itemId }, { foundItem: itemId }],
      })
        .populate('lostItem')
        .populate('foundItem')
        .sort({ hybridScore: -1 });

      return res.json({ success: true, count: matches.length, matches });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Confirm or reject a match candidate
   */
  async updateMatchStatus(req, res) {
    try {
      const { matchId } = req.params;
      const { status } = req.body; // 'CONFIRMED_BY_USER' | 'REJECTED'

      const match = await MatchHistory.findByIdAndUpdate(
        matchId,
        { status, reviewedAt: new Date() },
        { new: true }
      );

      if (!match) {
        return res.status(404).json({ success: false, message: 'Match record not found' });
      }

      if (status === 'CONFIRMED_BY_USER') {
        await Item.findByIdAndUpdate(match.lostItem, { status: 'MATCHED', matchedItem: match.foundItem });
        await Item.findByIdAndUpdate(match.foundItem, { status: 'MATCHED', matchedItem: match.lostItem });
      }

      return res.json({ success: true, match });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MatchController();
