export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      phone,
      address,
      note,
      items,
      total
    } = req.body;

    if (!name || !phone || !address || !items || !total) {
      return res.status(400).json({
        error: "Missing order information"
      });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        error: "Telegram configuration missing"
      });
    }

    let message = `🛍️ NEW ORDER — MEHFIL WEAR\n\n`;

    message += `👤 Name: ${name}\n`;
    message += `📱 Phone: ${phone}\n`;
    message += `📍 Address: ${address}\n`;

    if (note) {
      message += `📝 Note: ${note}\n`;
    }

    message += `\n🛒 ORDER DETAILS\n`;

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} — Rs. ${Number(item.price).toLocaleString()}\n`;
    });

    message += `\n💰 TOTAL: Rs. ${Number(total).toLocaleString()}`;

    const telegramURL =
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    const result = await response.json();

    if (!result.ok) {
      return res.status(500).json({
        error: "Telegram message failed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order placed successfully"
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error"
    });
  }
}