import Campaign from "../models/Campaign.js";
import Customer from "../models/Customer.js";
import Subscriber from "../models/Subscriber.js";

function map(c) {
  const doc = c.toObject ? c.toObject() : c;
  return { ...doc, id: String(doc._id) };
}

/** Send / run a campaign — counts audience and marks Sent */
export async function sendCampaign(req, res, next) {
  try {
    const campaign =
      (await Campaign.findById(req.params.id).catch(() => null)) ||
      (await Campaign.findOne({ name: req.params.id }));
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (!campaign.body && !campaign.subject) {
      return res.status(400).json({
        message: "Add a subject and message body before sending",
      });
    }

    let recipients = 0;
    const audience = String(campaign.audience || "All customers").toLowerCase();

    if (audience.includes("subscriber") || audience.includes("newsletter")) {
      recipients = await Subscriber.countDocuments();
    } else if (audience.includes("vip") || audience.includes("spent")) {
      recipients = await Customer.countDocuments({ spent: { $gte: 100000 } });
    } else {
      recipients = await Customer.countDocuments();
    }

    if (recipients === 0) recipients = 1; // demo fallback

    campaign.sent = recipients;
    campaign.status = "Sent";
    campaign.date = new Date().toISOString().slice(0, 10);
    campaign.lastSentAt = new Date();
    // Simulated open rate
    const open = Math.min(68, Math.max(12, Math.round(18 + Math.random() * 40)));
    campaign.openRate = `${open}%`;
    await campaign.save();

    res.json({
      ok: true,
      message: `Campaign sent to ${recipients} recipients via ${campaign.channel}`,
      campaign: map(campaign),
    });
  } catch (err) {
    next(err);
  }
}
