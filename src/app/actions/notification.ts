'use server';

import 'server-only';
import axios from 'axios';
import { db } from '@/lib/db';

export async function sendDoorayMessage(projectId: string, text: string) {
    try {
        // Fetch project webhook URL
        const res = await db.query(
            "SELECT dooray_webhook_url FROM projects WHERE id = $1",
            [projectId]
        );

        const webhookUrl = res.rows[0]?.dooray_webhook_url;
        if (!webhookUrl) {
            console.log(`[Notification] No Dooray Webhook URL set for project ${projectId}`);
            return;
        }

        await axios.post(webhookUrl, {
            botName: "API HUB Bot",
            botIconImage: "https://static.dooray.com/static_images/favicon.ico",
            text: text
        });

        console.log(`[Notification] Dooray message sent for project ${projectId}`);
    } catch (error) {
        console.error("[Notification] Failed to send Dooray message:", error);
    }
}
